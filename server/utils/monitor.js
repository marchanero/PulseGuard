import { db, services, serviceLogs, performanceMetrics, notificationRules, notificationChannels, maintenanceWindows } from '../lib/db.js';
import { checkService, checkSSL } from './checkTypes.js';
import { eq, and, isNull, or, lte, gte } from 'drizzle-orm';
import { sendNotification, notifyServiceEvent } from './notificationService.js';

// Mapa para almacenar los intervalos activos
const activeIntervals = new Map();

// Mapa para almacenar el estado previo de cada servicio (para detectar cambios)
const previousStatus = new Map();

/**
 * Check if a service is currently in a maintenance window
 */
async function isInMaintenance(serviceId) {
  try {
    const now = new Date().toISOString();
    
    const activeWindows = await db.select()
      .from(maintenanceWindows)
      .where(
        and(
          eq(maintenanceWindows.serviceId, serviceId),
          eq(maintenanceWindows.isActive, true),
          lte(maintenanceWindows.startTime, now),
          gte(maintenanceWindows.endTime, now)
        )
      );
    
    return activeWindows.length > 0;
  } catch (error) {
    console.error(`[Monitor] Error checking maintenance status for service ${serviceId}:`, error.message);
    return false;
  }
}

// Función para verificar un servicio y actualizar su estado
async function monitorService(serviceId) {
  try {
    const serviceResult = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    const service = serviceResult[0];

    if (!service || !service.isActive) {
      // Si el servicio no existe o está inactivo, detener el monitoreo
      stopMonitoring(serviceId);
      return;
    }

    const result = await checkService(service);
    
    // Verificar SSL para URLs HTTPS
    let sslInfo = null;
    if (service.url && service.url.startsWith('https://')) {
      try {
        const urlObj = new URL(service.url);
        const sslResult = await checkSSL(urlObj.hostname, urlObj.port || 443);
        if (sslResult.data) {
          sslInfo = {
            expiryDate: sslResult.data.validTo,
            daysRemaining: sslResult.data.daysUntilExpiry,
            issuer: sslResult.data.issuer,
            subject: sslResult.data.subject
          };
        }
      } catch (sslError) {
        console.error(`[Monitor] Error verificando SSL para ${service.name}:`, sslError.message);
      }
    }

    // Calcular uptime basado en el estado actual
    let newUptime = service.uptime || 100;
    const now = new Date().toISOString();
    const lastChecked = service.lastChecked;
    
    // Solo recalcular uptime si hay un check previo
    if (lastChecked) {
      const lastCheckedDate = new Date(lastChecked);
      const nowDate = new Date();
      const timeSinceLastCheck = nowDate - lastCheckedDate;
      
      // Actualizar tiempo total monitoreado
      const totalMonitoredTime = (service.totalMonitoredTime || 0) + timeSinceLastCheck;
      
      // Calcular uptime: tiempo online/degradado / tiempo total monitoreado
      const wasOnlineOrDegraded = result.status === 'online' || result.status === 'degraded';
      const onlineTime = (service.onlineTime || 0) + (wasOnlineOrDegraded ? timeSinceLastCheck : 0);
      
      newUptime = totalMonitoredTime > 0 ? (onlineTime / totalMonitoredTime) * 100 : 100;
      
      // Actualizar el servicio con los nuevos datos y métricas de uptime
      const updateData = {
        status: result.status,
        responseTime: result.responseTime,
        lastChecked: now,
        uptime: newUptime,
        totalMonitoredTime: totalMonitoredTime,
        onlineTime: onlineTime
      };
      
      // Añadir estado de validación de contenido si existe
      if (result.contentMatch !== undefined) {
        updateData.lastContentMatch = result.contentMatch;
      }
      
      // Añadir información SSL si está disponible
      if (sslInfo) {
        updateData.sslExpiryDate = sslInfo.expiryDate;
        updateData.sslDaysRemaining = sslInfo.daysRemaining;
      }
      
      await db.update(services)
        .set(updateData)
        .where(eq(services.id, serviceId));
    } else {
      // Primera verificación - inicializar uptime
      const updateData = {
        status: result.status,
        responseTime: result.responseTime,
        lastChecked: now,
        uptime: result.status === 'online' ? 100 : 0,
        totalMonitoredTime: 0,
        onlineTime: result.status === 'online' ? 0 : 0
      };
      
      // Añadir estado de validación de contenido si existe
      if (result.contentMatch !== undefined) {
        updateData.lastContentMatch = result.contentMatch;
      }
      
      // Añadir información SSL si está disponible
      if (sslInfo) {
        updateData.sslExpiryDate = sslInfo.expiryDate;
        updateData.sslDaysRemaining = sslInfo.daysRemaining;
      }
      
      await db.update(services)
        .set(updateData)
        .where(eq(services.id, serviceId));
    }

    // Crear log
    await db.insert(serviceLogs).values({
      serviceId: serviceId,
      status: result.status,
      responseTime: result.responseTime,
      message: result.message,
      timestamp: now,
      contentMatchStatus: result.contentMatch !== undefined ? result.contentMatch : null
    });

    // Guardar métrica de rendimiento para análisis histórico
    await db.insert(performanceMetrics).values({
      serviceId: serviceId,
      responseTime: result.responseTime,
      status: result.status,
      uptime: newUptime,
      timestamp: now
    });

    // === NOTIFICATION LOGIC ===
    const prevStatus = previousStatus.get(serviceId);
    const currentStatus = result.status;
    
    // Check if service is in maintenance mode
    const inMaintenance = await isInMaintenance(serviceId);
    
    // Detect status change
    if (prevStatus && prevStatus !== currentStatus) {
      let event = null;
      
      // Determine event type
      if (currentStatus === 'offline' || currentStatus === 'timeout') {
        event = 'down';
      } else if (currentStatus === 'online' && (prevStatus === 'offline' || prevStatus === 'timeout')) {
        event = 'up';
      } else if (currentStatus === 'degraded') {
        event = 'degraded';
      }
      
      if (event && !inMaintenance) {
        // Only trigger notifications if NOT in maintenance
        await triggerNotifications(service, event, result);
      } else if (event && inMaintenance) {
        console.log(`[Monitor] Service ${service.name} event ${event} suppressed - in maintenance mode`);
      }
    }
    
    // Check SSL warnings (also skip if in maintenance)
    if (sslInfo && sslInfo.daysRemaining !== null && !inMaintenance) {
      if (sslInfo.daysRemaining <= 0) {
        await triggerNotifications(service, 'ssl_expiry', { sslInfo });
      } else if (sslInfo.daysRemaining <= 14) {
        // Warn 14 days before expiry (only once per day)
        const lastSSLWarning = service.lastSSLWarning ? new Date(service.lastSSLWarning) : null;
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (!lastSSLWarning || lastSSLWarning < oneDayAgo) {
          await triggerNotifications(service, 'ssl_warning', { sslInfo });
        }
      }
    }
    
    // Update previous status
    previousStatus.set(serviceId, currentStatus);

    console.log(`[Monitor] Servicio ${service.name} verificado: ${result.status} (${result.responseTime}ms)`);
  } catch (error) {
    console.error(`[Monitor] Error verificando servicio ${serviceId}:`, error.message);
  }
}

// Iniciar monitoreo de un servicio
export function startMonitoring(service) {
  // Detener monitoreo existente si hay uno
  stopMonitoring(service.id);

  if (!service.isActive) {
    console.log(`[Monitor] Servicio ${service.name} está inactivo, no se inicia monitoreo`);
    return;
  }

  // Convertir segundos a milisegundos
  const intervalMs = service.checkInterval * 1000;

  // Realizar primera verificación inmediatamente
  monitorService(service.id);

  // Configurar intervalo para verificaciones periódicas
  const intervalId = setInterval(() => {
    monitorService(service.id);
  }, intervalMs);

  // Guardar referencia al intervalo
  activeIntervals.set(service.id, intervalId);

  console.log(`[Monitor] Iniciado monitoreo de ${service.name} cada ${service.checkInterval} segundos`);
}

// Detener monitoreo de un servicio
export function stopMonitoring(serviceId) {
  const intervalId = activeIntervals.get(serviceId);
  if (intervalId) {
    clearInterval(intervalId);
    activeIntervals.delete(serviceId);
    console.log(`[Monitor] Detenido monitoreo del servicio ${serviceId}`);
  }
}

// Detener todos los monitoreos
export function stopAllMonitoring() {
  for (const [serviceId, intervalId] of activeIntervals) {
    clearInterval(intervalId);
    console.log(`[Monitor] Detenido monitoreo del servicio ${serviceId}`);
  }
  activeIntervals.clear();
}

// Iniciar monitoreo de todos los servicios activos
export async function startAllMonitoring() {
  try {
    const servicesResult = await db.select().from(services).where(eq(services.isActive, true));
    const servicesList = servicesResult.map(s => ({
      ...s,
      isActive: Boolean(s.isActive)
    }));

    console.log(`[Monitor] Iniciando monitoreo de ${servicesList.length} servicios`);

    for (const service of servicesList) {
      startMonitoring(service);
    }
  } catch (error) {
    console.error('[Monitor] Error iniciando monitoreo:', error);
  }
}

// Obtener estado del monitoreo
export function getMonitoringStatus() {
  return {
    activeServices: activeIntervals.size,
    serviceIds: Array.from(activeIntervals.keys())
  };
}

// === NOTIFICATION HELPER FUNCTIONS ===

/**
 * Trigger notifications for a service event
 */
async function triggerNotifications(service, event, additionalData = {}) {
  try {
    // Get all applicable rules (service-specific + global)
    const rules = await db.select({
      rule: notificationRules,
      channel: notificationChannels
    })
    .from(notificationRules)
    .leftJoin(notificationChannels, eq(notificationRules.channelId, notificationChannels.id))
    .where(
      and(
        eq(notificationRules.isEnabled, true),
        or(
          eq(notificationRules.serviceId, service.id),
          isNull(notificationRules.serviceId) // Global rules
        )
      )
    );

    if (rules.length === 0) {
      console.log(`[Monitor] No notification rules found for service ${service.name} event ${event}`);
      return;
    }

    for (const { rule, channel } of rules) {
      // Check if this rule handles this event
      const events = JSON.parse(rule.events || '[]');
      if (!events.includes(event)) {
        continue;
      }

      // Check if channel is enabled
      if (!channel || !channel.isEnabled) {
        continue;
      }

      // Check cooldown
      if (rule.lastNotified) {
        const lastNotified = new Date(rule.lastNotified);
        const cooldownMs = (rule.cooldown || 300) * 1000;
        if (Date.now() - lastNotified.getTime() < cooldownMs) {
          console.log(`[Monitor] Skipping notification for ${service.name} - cooldown active`);
          continue;
        }
      }

      // Check threshold for down events
      if (event === 'down') {
        const newFailures = (rule.consecutiveFailures || 0) + 1;
        
        // Update consecutive failures
        await db.update(notificationRules)
          .set({ 
            consecutiveFailures: newFailures,
            updatedAt: new Date().toISOString()
          })
          .where(eq(notificationRules.id, rule.id));

        // Check if threshold met
        if (newFailures < (rule.threshold || 1)) {
          console.log(`[Monitor] Threshold not met for ${service.name}: ${newFailures}/${rule.threshold}`);
          continue;
        }
      }

      // Reset consecutive failures on recovery
      if (event === 'up' && rule.consecutiveFailures > 0) {
        await db.update(notificationRules)
          .set({ 
            consecutiveFailures: 0,
            updatedAt: new Date().toISOString()
          })
          .where(eq(notificationRules.id, rule.id));
      }

      // Build notification payload
      const payload = await notifyServiceEvent(service, event, additionalData);

      // Send notification
      console.log(`[Monitor] Sending ${event} notification for ${service.name} to ${channel.name}`);
      
      const result = await sendNotification({
        ...channel,
        config: JSON.parse(channel.config || '{}')
      }, payload);

      if (result.success) {
        // Update last notified time
        await db.update(notificationRules)
          .set({ 
            lastNotified: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(notificationRules.id, rule.id));
        
        console.log(`[Monitor] Notification sent successfully to ${channel.name}`);
      } else {
        console.error(`[Monitor] Failed to send notification to ${channel.name}:`, result.error);
      }
    }
  } catch (error) {
    console.error(`[Monitor] Error triggering notifications for ${service.name}:`, error.message);
  }
}
