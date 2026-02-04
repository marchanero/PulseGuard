import express from 'express';
import { db, notificationChannels, notificationRules, notificationHistory, services } from '../lib/db.js';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { testNotification } from '../utils/notificationService.js';

const router = express.Router();

// ===== NOTIFICATION CHANNELS =====

// Get all channels
router.get('/channels', async (req, res) => {
  try {
    const channels = await db.select().from(notificationChannels).orderBy(desc(notificationChannels.createdAt));
    
    // Parse config JSON
    const parsedChannels = channels.map(ch => ({
      ...ch,
      config: JSON.parse(ch.config || '{}'),
      isEnabled: Boolean(ch.isEnabled),
      isDefault: Boolean(ch.isDefault)
    }));
    
    res.json(parsedChannels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Error al obtener canales', message: error.message });
  }
});

// Get single channel
router.get('/channels/:id', async (req, res) => {
  try {
    const channelId = parseInt(req.params.id);
    const [channel] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, channelId));
    
    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }
    
    res.json({
      ...channel,
      config: JSON.parse(channel.config || '{}'),
      isEnabled: Boolean(channel.isEnabled),
      isDefault: Boolean(channel.isDefault)
    });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Error al obtener canal', message: error.message });
  }
});

// Create channel
router.post('/channels', async (req, res) => {
  try {
    const { name, type, config, isEnabled = true, isDefault = false } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    }
    
    const validTypes = ['webhook', 'discord', 'slack', 'telegram', 'email'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}` });
    }
    
    // Validate config based on type
    const validationError = validateChannelConfig(type, config);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    
    const [newChannel] = await db.insert(notificationChannels).values({
      name,
      type,
      config: JSON.stringify(config || {}),
      isEnabled,
      isDefault
    }).returning();
    
    res.status(201).json({
      ...newChannel,
      config: JSON.parse(newChannel.config),
      isEnabled: Boolean(newChannel.isEnabled),
      isDefault: Boolean(newChannel.isDefault)
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Error al crear canal', message: error.message });
  }
});

// Update channel
router.put('/channels/:id', async (req, res) => {
  try {
    const channelId = parseInt(req.params.id);
    const { name, type, config, isEnabled, isDefault } = req.body;
    
    const [existing] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, channelId));
    
    if (!existing) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }
    
    const updateData = { updatedAt: new Date().toISOString() };
    
    if (name) updateData.name = name;
    if (type) {
      const validTypes = ['webhook', 'discord', 'slack', 'telegram', 'email'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}` });
      }
      updateData.type = type;
    }
    if (config !== undefined) {
      const finalType = type || existing.type;
      const validationError = validateChannelConfig(finalType, config);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
      updateData.config = JSON.stringify(config);
    }
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    
    const [updated] = await db.update(notificationChannels)
      .set(updateData)
      .where(eq(notificationChannels.id, channelId))
      .returning();
    
    res.json({
      ...updated,
      config: JSON.parse(updated.config),
      isEnabled: Boolean(updated.isEnabled),
      isDefault: Boolean(updated.isDefault)
    });
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: 'Error al actualizar canal', message: error.message });
  }
});

// Delete channel
router.delete('/channels/:id', async (req, res) => {
  try {
    const channelId = parseInt(req.params.id);
    
    const [existing] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, channelId));
    
    if (!existing) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }
    
    await db.delete(notificationChannels).where(eq(notificationChannels.id, channelId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Error al eliminar canal', message: error.message });
  }
});

// Test channel
router.post('/channels/:id/test', async (req, res) => {
  try {
    const channelId = parseInt(req.params.id);
    
    const [channel] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, channelId));
    
    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }
    
    const result = await testNotification({
      ...channel,
      config: JSON.parse(channel.config)
    });
    
    // Log test in history
    await db.insert(notificationHistory).values({
      channelId,
      event: 'test',
      message: 'Notificación de prueba desde PulseGuard',
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error || null,
      metadata: JSON.stringify({ testAt: new Date().toISOString() })
    });
    
    if (result.success) {
      res.json({ success: true, message: 'Notificación de prueba enviada correctamente' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error testing channel:', error);
    res.status(500).json({ error: 'Error al probar canal', message: error.message });
  }
});

// ===== NOTIFICATION RULES =====

// Get all rules (optionally filtered by service)
router.get('/rules', async (req, res) => {
  try {
    const { serviceId } = req.query;
    
    let query = db.select({
      rule: notificationRules,
      channel: notificationChannels,
      service: services
    })
    .from(notificationRules)
    .leftJoin(notificationChannels, eq(notificationRules.channelId, notificationChannels.id))
    .leftJoin(services, eq(notificationRules.serviceId, services.id));
    
    if (serviceId) {
      if (serviceId === 'global') {
        query = query.where(isNull(notificationRules.serviceId));
      } else {
        query = query.where(eq(notificationRules.serviceId, parseInt(serviceId)));
      }
    }
    
    const results = await query.orderBy(desc(notificationRules.createdAt));
    
    const rules = results.map(r => ({
      ...r.rule,
      events: JSON.parse(r.rule.events || '[]'),
      isEnabled: Boolean(r.rule.isEnabled),
      channel: r.channel ? {
        id: r.channel.id,
        name: r.channel.name,
        type: r.channel.type
      } : null,
      service: r.service ? {
        id: r.service.id,
        name: r.service.name
      } : null
    }));
    
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Error al obtener reglas', message: error.message });
  }
});

// Create rule
router.post('/rules', async (req, res) => {
  try {
    const { serviceId, channelId, events, threshold = 1, cooldown = 300, isEnabled = true } = req.body;
    
    if (!channelId) {
      return res.status(400).json({ error: 'channelId es requerido' });
    }
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events debe ser un array con al menos un evento' });
    }
    
    const validEvents = ['down', 'up', 'degraded', 'ssl_expiry', 'ssl_warning'];
    const invalidEvents = events.filter(e => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({ error: `Eventos inválidos: ${invalidEvents.join(', ')}. Válidos: ${validEvents.join(', ')}` });
    }
    
    // Verify channel exists
    const [channel] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, channelId));
    if (!channel) {
      return res.status(400).json({ error: 'Canal no encontrado' });
    }
    
    // If serviceId provided, verify service exists
    if (serviceId) {
      const [service] = await db.select().from(services).where(eq(services.id, serviceId));
      if (!service) {
        return res.status(400).json({ error: 'Servicio no encontrado' });
      }
    }
    
    const [newRule] = await db.insert(notificationRules).values({
      serviceId: serviceId || null,
      channelId,
      events: JSON.stringify(events),
      threshold,
      cooldown,
      isEnabled
    }).returning();
    
    res.status(201).json({
      ...newRule,
      events: JSON.parse(newRule.events),
      isEnabled: Boolean(newRule.isEnabled)
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Error al crear regla', message: error.message });
  }
});

// Update rule
router.put('/rules/:id', async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    const { events, threshold, cooldown, isEnabled } = req.body;
    
    const [existing] = await db.select().from(notificationRules).where(eq(notificationRules.id, ruleId));
    
    if (!existing) {
      return res.status(404).json({ error: 'Regla no encontrada' });
    }
    
    const updateData = { updatedAt: new Date().toISOString() };
    
    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: 'events debe ser un array con al menos un evento' });
      }
      const validEvents = ['down', 'up', 'degraded', 'ssl_expiry', 'ssl_warning'];
      const invalidEvents = events.filter(e => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        return res.status(400).json({ error: `Eventos inválidos: ${invalidEvents.join(', ')}` });
      }
      updateData.events = JSON.stringify(events);
    }
    if (threshold !== undefined) updateData.threshold = threshold;
    if (cooldown !== undefined) updateData.cooldown = cooldown;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    
    const [updated] = await db.update(notificationRules)
      .set(updateData)
      .where(eq(notificationRules.id, ruleId))
      .returning();
    
    res.json({
      ...updated,
      events: JSON.parse(updated.events),
      isEnabled: Boolean(updated.isEnabled)
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Error al actualizar regla', message: error.message });
  }
});

// Delete rule
router.delete('/rules/:id', async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    
    const [existing] = await db.select().from(notificationRules).where(eq(notificationRules.id, ruleId));
    
    if (!existing) {
      return res.status(404).json({ error: 'Regla no encontrada' });
    }
    
    await db.delete(notificationRules).where(eq(notificationRules.id, ruleId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Error al eliminar regla', message: error.message });
  }
});

// ===== NOTIFICATION HISTORY =====

// Get notification history
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, channelId, serviceId, status } = req.query;
    
    let conditions = [];
    
    if (channelId) {
      conditions.push(eq(notificationHistory.channelId, parseInt(channelId)));
    }
    if (serviceId) {
      conditions.push(eq(notificationHistory.serviceId, parseInt(serviceId)));
    }
    if (status) {
      conditions.push(eq(notificationHistory.status, status));
    }
    
    const query = db.select({
      history: notificationHistory,
      channel: notificationChannels,
      service: services
    })
    .from(notificationHistory)
    .leftJoin(notificationChannels, eq(notificationHistory.channelId, notificationChannels.id))
    .leftJoin(services, eq(notificationHistory.serviceId, services.id))
    .orderBy(desc(notificationHistory.sentAt))
    .limit(parseInt(limit));
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    const results = await query;
    
    const history = results.map(r => ({
      ...r.history,
      metadata: JSON.parse(r.history.metadata || '{}'),
      channel: r.channel ? {
        id: r.channel.id,
        name: r.channel.name,
        type: r.channel.type
      } : null,
      service: r.service ? {
        id: r.service.id,
        name: r.service.name
      } : null
    }));
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Error al obtener historial', message: error.message });
  }
});

// ===== HELPER FUNCTIONS =====

function validateChannelConfig(type, config) {
  if (!config) return null;
  
  switch (type) {
    case 'webhook':
      if (!config.url) return 'URL del webhook es requerida';
      if (!isValidUrl(config.url)) return 'URL del webhook no es válida';
      break;
      
    case 'discord':
      if (!config.webhookUrl) return 'URL del webhook de Discord es requerida';
      if (!config.webhookUrl.includes('discord.com/api/webhooks')) {
        return 'URL del webhook de Discord no es válida';
      }
      break;
      
    case 'slack':
      if (!config.webhookUrl) return 'URL del webhook de Slack es requerida';
      if (!config.webhookUrl.includes('hooks.slack.com')) {
        return 'URL del webhook de Slack no es válida';
      }
      break;
      
    case 'telegram':
      if (!config.botToken) return 'Token del bot de Telegram es requerido';
      if (!config.chatId) return 'Chat ID de Telegram es requerido';
      break;
      
    case 'email':
      if (!config.smtpHost) return 'Host SMTP es requerido';
      if (!config.smtpPort) return 'Puerto SMTP es requerido';
      if (!config.fromEmail) return 'Email remitente es requerido';
      if (!config.toEmails || config.toEmails.length === 0) return 'Al menos un email destinatario es requerido';
      break;
  }
  
  return null;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export default router;
