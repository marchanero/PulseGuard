import { db } from '../lib/db.js';
import { notificationChannels, notificationRules, notificationHistory, services } from '../lib/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Enviar notificación webhook
 */
async function sendWebhook(url, method, headers, payload) {
  const response = await fetch(url, {
    method: method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'PulseGuard-Webhook/1.0',
      ...headers
    },
    body: JSON.stringify(payload),
    timeout: 10000 // 10 segundos
  });

  return {
    success: response.ok,
    statusCode: response.status,
    statusText: response.statusText
  };
}

/**
 * Notificar cambio de estado de servicio
 */
export async function notifyServiceStatusChange(serviceId, event, metadata = {}) {
  try {
    // Obtener información del servicio
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId));

    if (!service) {
      console.error(`Servicio ${serviceId} no encontrado`);
      return;
    }

    // Obtener reglas activas para este servicio y evento
    const rules = await db
      .select({
        rule: notificationRules,
        channel: notificationChannels
      })
      .from(notificationRules)
      .innerJoin(
        notificationChannels,
        eq(notificationRules.channelId, notificationChannels.id)
      )
      .where(and(
        eq(notificationRules.serviceId, serviceId),
        eq(notificationRules.isEnabled, true),
        eq(notificationChannels.isEnabled, true),
        eq(notificationChannels.type, 'webhook')
      ));

    if (rules.length === 0) {
      return; // No hay webhooks configurados para este servicio
    }

    const now = new Date();

    for (const { rule, channel } of rules) {
      try {
        const ruleEvents = JSON.parse(rule.events || '[]');
        
        // Verificar si este evento está en la lista de eventos de la regla
        if (!ruleEvents.includes(event)) {
          continue;
        }

        // Verificar cooldown
        if (rule.lastNotified) {
          const lastNotified = new Date(rule.lastNotified);
          const secondsSinceLastNotification = (now - lastNotified) / 1000;
          
          if (secondsSinceLastNotification < rule.cooldown) {
            console.log(`Webhook ${channel.id} en cooldown, saltando notificación`);
            continue;
          }
        }

        // Verificar threshold para eventos 'down'
        if (event === 'down') {
          if (rule.consecutiveFailures < rule.threshold) {
            console.log(`Threshold no alcanzado para webhook ${channel.id} (${rule.consecutiveFailures}/${rule.threshold})`);
            continue;
          }
        }

        // Preparar payload
        const config = JSON.parse(channel.config || '{}');
        const payload = {
          event,
          timestamp: now.toISOString(),
          service: {
            id: service.id,
            name: service.name,
            type: service.type,
            url: service.url,
            status: service.status,
            responseTime: service.responseTime,
            uptime: service.uptime,
            lastChecked: service.lastChecked
          },
          metadata: {
            ...metadata,
            previousStatus: metadata.previousStatus,
            currentStatus: service.status,
            message: getEventMessage(event, service, metadata)
          }
        };

        // Enviar webhook
        console.log(`Enviando webhook a ${config.url} para evento ${event} del servicio ${service.name}`);
        const result = await sendWebhook(
          config.url,
          config.method,
          config.headers || {},
          payload
        );

        // Registrar en historial
        await db.insert(notificationHistory).values({
          channelId: channel.id,
          serviceId: service.id,
          event,
          message: getEventMessage(event, service, metadata),
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.success ? null : `HTTP ${result.statusCode}: ${result.statusText}`,
          metadata: JSON.stringify({
            statusCode: result.statusCode,
            statusText: result.statusText,
            payload
          })
        });

        // Actualizar lastNotified en la regla
        await db
          .update(notificationRules)
          .set({
            lastNotified: now.toISOString(),
            // Resetear consecutiveFailures si el servicio volvió online
            consecutiveFailures: event === 'up' ? 0 : rule.consecutiveFailures
          })
          .where(eq(notificationRules.id, rule.id));

        console.log(`Webhook enviado exitosamente: ${result.success ? 'OK' : 'FAILED'}`);
      } catch (error) {
        console.error(`Error al enviar webhook ${channel.id}:`, error);
        
        // Registrar error en historial
        await db.insert(notificationHistory).values({
          channelId: channel.id,
          serviceId: service.id,
          event,
          message: getEventMessage(event, service, metadata),
          status: 'failed',
          errorMessage: error.message,
          metadata: JSON.stringify({ error: error.stack })
        });
      }
    }
  } catch (error) {
    console.error('Error en notifyServiceStatusChange:', error);
  }
}

/**
 * Incrementar contador de fallos consecutivos
 */
export async function incrementConsecutiveFailures(serviceId) {
  try {
    const rules = await db
      .select()
      .from(notificationRules)
      .where(and(
        eq(notificationRules.serviceId, serviceId),
        eq(notificationRules.isEnabled, true)
      ));

    for (const rule of rules) {
      await db
        .update(notificationRules)
        .set({
          consecutiveFailures: rule.consecutiveFailures + 1
        })
        .where(eq(notificationRules.id, rule.id));
    }
  } catch (error) {
    console.error('Error al incrementar consecutiveFailures:', error);
  }
}

/**
 * Resetear contador de fallos consecutivos
 */
export async function resetConsecutiveFailures(serviceId) {
  try {
    await db
      .update(notificationRules)
      .set({
        consecutiveFailures: 0
      })
      .where(eq(notificationRules.serviceId, serviceId));
  } catch (error) {
    console.error('Error al resetear consecutiveFailures:', error);
  }
}

/**
 * Generar mensaje para el evento
 */
function getEventMessage(event, service, metadata) {
  switch (event) {
    case 'down':
      return `🔴 El servicio "${service.name}" está OFFLINE${metadata.message ? ': ' + metadata.message : ''}`;
    case 'up':
      return `🟢 El servicio "${service.name}" está ONLINE nuevamente`;
    case 'degraded':
      return `🟡 El servicio "${service.name}" tiene rendimiento degradado (${service.responseTime}ms)`;
    case 'ssl_expiry':
      return `⚠️ El certificado SSL de "${service.name}" expira en ${metadata.daysRemaining} días`;
    case 'content_mismatch':
      return `⚠️ El contenido de "${service.name}" no coincide con el patrón esperado`;
    default:
      return `Evento ${event} en servicio "${service.name}"`;
  }
}

export default {
  notifyServiceStatusChange,
  incrementConsecutiveFailures,
  resetConsecutiveFailures
};
