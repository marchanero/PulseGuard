import express from 'express';
import { db } from '../lib/db.js';
import { notificationChannels, notificationRules, notificationHistory } from '../lib/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from './auth.js';

const router = express.Router();

// Obtener todos los webhooks
router.get('/', requireAuth, async (req, res) => {
  try {
    const webhooks = await db
      .select()
      .from(notificationChannels)
      .where(eq(notificationChannels.type, 'webhook'))
      .orderBy(desc(notificationChannels.createdAt));

    const webhooksWithRules = await Promise.all(
      webhooks.map(async (webhook) => {
        const rules = await db
          .select()
          .from(notificationRules)
          .where(eq(notificationRules.channelId, webhook.id));
        
        return {
          ...webhook,
          config: JSON.parse(webhook.config || '{}'),
          rules: rules.map(rule => ({
            ...rule,
            events: JSON.parse(rule.events || '[]')
          }))
        };
      })
    );

    res.json(webhooksWithRules);
  } catch (error) {
    console.error('Error al obtener webhooks:', error);
    res.status(500).json({ error: 'Error al obtener webhooks' });
  }
});

// Crear nuevo webhook
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, url, method = 'POST', headers = {}, events = [], services = [] } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Nombre y URL son requeridos' });
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'URL inválida' });
    }

    // Crear el canal de webhook
    const [webhook] = await db
      .insert(notificationChannels)
      .values({
        name,
        type: 'webhook',
        config: JSON.stringify({
          url,
          method,
          headers,
          contentType: 'application/json'
        }),
        isEnabled: true,
        isDefault: false
      })
      .returning();

    // Crear reglas para cada servicio
    if (services.length > 0 && events.length > 0) {
      for (const serviceId of services) {
        await db.insert(notificationRules).values({
          serviceId,
          channelId: webhook.id,
          events: JSON.stringify(events),
          threshold: 1,
          cooldown: 300,
          isEnabled: true,
          consecutiveFailures: 0
        });
      }
    }

    // Obtener webhook con reglas
    const rules = await db
      .select()
      .from(notificationRules)
      .where(eq(notificationRules.channelId, webhook.id));

    res.status(201).json({
      ...webhook,
      config: JSON.parse(webhook.config),
      rules: rules.map(rule => ({
        ...rule,
        events: JSON.parse(rule.events)
      }))
    });
  } catch (error) {
    console.error('Error al crear webhook:', error);
    res.status(500).json({ error: 'Error al crear webhook' });
  }
});

// Actualizar webhook
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, method, headers, isEnabled } = req.body;

    const [existing] = await db
      .select()
      .from(notificationChannels)
      .where(and(
        eq(notificationChannels.id, parseInt(id)),
        eq(notificationChannels.type, 'webhook')
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Webhook no encontrado' });
    }

    const currentConfig = JSON.parse(existing.config || '{}');
    const updatedConfig = {
      url: url || currentConfig.url,
      method: method || currentConfig.method,
      headers: headers !== undefined ? headers : currentConfig.headers,
      contentType: 'application/json'
    };

    // Validar URL si se proporciona
    if (url) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'URL inválida' });
      }
    }

    const [updated] = await db
      .update(notificationChannels)
      .set({
        name: name || existing.name,
        config: JSON.stringify(updatedConfig),
        isEnabled: isEnabled !== undefined ? isEnabled : existing.isEnabled,
        updatedAt: new Date().toISOString()
      })
      .where(eq(notificationChannels.id, parseInt(id)))
      .returning();

    const rules = await db
      .select()
      .from(notificationRules)
      .where(eq(notificationRules.channelId, updated.id));

    res.json({
      ...updated,
      config: JSON.parse(updated.config),
      rules: rules.map(rule => ({
        ...rule,
        events: JSON.parse(rule.events)
      }))
    });
  } catch (error) {
    console.error('Error al actualizar webhook:', error);
    res.status(500).json({ error: 'Error al actualizar webhook' });
  }
});

// Eliminar webhook
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(notificationChannels)
      .where(and(
        eq(notificationChannels.id, parseInt(id)),
        eq(notificationChannels.type, 'webhook')
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Webhook no encontrado' });
    }

    // Las reglas se eliminarán automáticamente por CASCADE
    await db
      .delete(notificationChannels)
      .where(eq(notificationChannels.id, parseInt(id)));

    res.json({ message: 'Webhook eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar webhook:', error);
    res.status(500).json({ error: 'Error al eliminar webhook' });
  }
});

// Probar webhook
router.post('/:id/test', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [webhook] = await db
      .select()
      .from(notificationChannels)
      .where(and(
        eq(notificationChannels.id, parseInt(id)),
        eq(notificationChannels.type, 'webhook')
      ));

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook no encontrado' });
    }

    const config = JSON.parse(webhook.config);
    
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      service: {
        name: 'Test Service',
        status: 'online'
      },
      message: 'Este es un mensaje de prueba desde PulseGuard'
    };

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PulseGuard-Webhook/1.0',
        ...config.headers
      },
      body: JSON.stringify(testPayload)
    });

    const success = response.ok;

    // Registrar en historial
    await db.insert(notificationHistory).values({
      channelId: webhook.id,
      serviceId: null,
      event: 'test',
      message: 'Webhook de prueba',
      status: success ? 'sent' : 'failed',
      errorMessage: success ? null : `HTTP ${response.status}: ${response.statusText}`,
      metadata: JSON.stringify({
        statusCode: response.status,
        statusText: response.statusText
      })
    });

    if (success) {
      res.json({ 
        success: true, 
        message: 'Webhook enviado correctamente',
        statusCode: response.status 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: `Error HTTP ${response.status}: ${response.statusText}` 
      });
    }
  } catch (error) {
    console.error('Error al probar webhook:', error);
    
    // Registrar error en historial
    try {
      await db.insert(notificationHistory).values({
        channelId: parseInt(req.params.id),
        serviceId: null,
        event: 'test',
        message: 'Webhook de prueba',
        status: 'failed',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Error al registrar en historial:', logError);
    }

    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al enviar webhook' 
    });
  }
});

// Obtener historial de webhook
router.get('/:id/history', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const history = await db
      .select()
      .from(notificationHistory)
      .where(eq(notificationHistory.channelId, parseInt(id)))
      .orderBy(desc(notificationHistory.sentAt))
      .limit(limit);

    res.json(history.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null
    })));
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Gestionar reglas de notificación de un webhook
router.post('/:id/rules', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceId, events, threshold = 1, cooldown = 300 } = req.body;

    if (!serviceId || !events || events.length === 0) {
      return res.status(400).json({ error: 'serviceId y events son requeridos' });
    }

    const [webhook] = await db
      .select()
      .from(notificationChannels)
      .where(eq(notificationChannels.id, parseInt(id)));

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook no encontrado' });
    }

    // Verificar si ya existe una regla para este servicio y webhook
    const [existing] = await db
      .select()
      .from(notificationRules)
      .where(and(
        eq(notificationRules.channelId, parseInt(id)),
        eq(notificationRules.serviceId, serviceId)
      ));

    let rule;
    if (existing) {
      // Actualizar regla existente
      [rule] = await db
        .update(notificationRules)
        .set({
          events: JSON.stringify(events),
          threshold,
          cooldown,
          updatedAt: new Date().toISOString()
        })
        .where(eq(notificationRules.id, existing.id))
        .returning();
    } else {
      // Crear nueva regla
      [rule] = await db
        .insert(notificationRules)
        .values({
          serviceId,
          channelId: parseInt(id),
          events: JSON.stringify(events),
          threshold,
          cooldown,
          isEnabled: true,
          consecutiveFailures: 0
        })
        .returning();
    }

    res.json({
      ...rule,
      events: JSON.parse(rule.events)
    });
  } catch (error) {
    console.error('Error al gestionar regla:', error);
    res.status(500).json({ error: 'Error al gestionar regla' });
  }
});

// Eliminar regla de notificación
router.delete('/:id/rules/:ruleId', requireAuth, async (req, res) => {
  try {
    const { id, ruleId } = req.params;

    await db
      .delete(notificationRules)
      .where(and(
        eq(notificationRules.id, parseInt(ruleId)),
        eq(notificationRules.channelId, parseInt(id))
      ));

    res.json({ message: 'Regla eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar regla:', error);
    res.status(500).json({ error: 'Error al eliminar regla' });
  }
});

export default router;
