import { db, services, serviceLogs, performanceMetrics } from '../lib/db.js';
import { checkService } from './checkTypes.js';
import { eq, and } from 'drizzle-orm';

// Mapa para almacenar los intervalos activos
const activeIntervals = new Map();

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
      await db.update(services)
        .set({
          status: result.status,
          responseTime: result.responseTime,
          lastChecked: now,
          uptime: newUptime,
          totalMonitoredTime: totalMonitoredTime,
          onlineTime: onlineTime
        })
        .where(eq(services.id, serviceId));
    } else {
      // Primera verificación - inicializar uptime
      await db.update(services)
        .set({
          status: result.status,
          responseTime: result.responseTime,
          lastChecked: now,
          uptime: result.status === 'online' ? 100 : 0,
          totalMonitoredTime: 0,
          onlineTime: result.status === 'online' ? 0 : 0
        })
        .where(eq(services.id, serviceId));
    }

    // Crear log
    await db.insert(serviceLogs).values({
      serviceId: serviceId,
      status: result.status,
      responseTime: result.responseTime,
      message: result.message,
      timestamp: now
    });

    // Guardar métrica de rendimiento para análisis histórico
    await db.insert(performanceMetrics).values({
      serviceId: serviceId,
      responseTime: result.responseTime,
      status: result.status,
      uptime: newUptime,
      timestamp: now
    });

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
