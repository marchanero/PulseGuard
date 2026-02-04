import express from 'express';
import { db, services as serviceTable, serviceLogs as serviceLogTable, performanceMetrics as performanceMetricTable } from '../lib/db.js';
import { checkService } from '../utils/checkTypes.js';
import { startMonitoring, stopMonitoring } from '../utils/monitor.js';
import { eq, desc, asc, and, gte, sql } from 'drizzle-orm';

const router = express.Router();

// Obtener todos los servicios activos (no eliminados)
router.get('/', async (req, res) => {
  try {
    const services = await db.select({
      id: serviceTable.id,
      name: serviceTable.name,
      type: serviceTable.type,
      url: serviceTable.url,
      host: serviceTable.host,
      port: serviceTable.port,
      description: serviceTable.description,
      tags: serviceTable.tags,
      checkInterval: serviceTable.checkInterval,
      isActive: serviceTable.isActive,
      isPublic: serviceTable.isPublic,
      status: serviceTable.status,
      responseTime: serviceTable.responseTime,
      uptime: serviceTable.uptime,
      lastChecked: serviceTable.lastChecked,
      totalMonitoredTime: serviceTable.totalMonitoredTime,
      onlineTime: serviceTable.onlineTime,
      sslExpiryDate: serviceTable.sslExpiryDate,
      sslDaysRemaining: serviceTable.sslDaysRemaining,
      createdAt: serviceTable.createdAt,
      updatedAt: serviceTable.updatedAt,
      logs: sql<typeof serviceLogTable>`(SELECT json_group_array(
        json_object(
          'id', ${serviceLogTable.id},
          'serviceId', ${serviceLogTable.serviceId},
          'status', ${serviceLogTable.status},
          'responseTime', ${serviceLogTable.responseTime},
          'message', ${serviceLogTable.message},
          'timestamp', ${serviceLogTable.timestamp}
        )
      ) FROM ${serviceLogTable} WHERE ${serviceLogTable.serviceId} = ${serviceTable.id} ORDER BY ${serviceLogTable.timestamp} DESC LIMIT 10)`
    })
    .from(serviceTable)
    .where(eq(serviceTable.isDeleted, false))
    .orderBy(desc(serviceTable.createdAt));
    
    // Parsear los logs y tags como JSON
    const parsedServices = services.map(s => {
      try {
        let parsedTags = [];
        if (s.tags) {
          try {
            parsedTags = JSON.parse(s.tags);
          } catch (e) {
            parsedTags = [];
          }
        }
        return {
          ...s,
          tags: parsedTags,
          logs: s.logs ? JSON.parse(s.logs) : []
        };
      } catch (error) {
        console.error('Error parsing data for service', s.id, ':', error);
        return {
          ...s,
          tags: [],
          logs: []
        };
      }
    });
    
    res.json(parsedServices);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios', message: error.message });
  }
});

// Obtener servicios archivados (eliminados)
router.get('/archived', async (req, res) => {
  try {
    const services = await db.select({
      id: serviceTable.id,
      name: serviceTable.name,
      type: serviceTable.type,
      url: serviceTable.url,
      host: serviceTable.host,
      port: serviceTable.port,
      description: serviceTable.description,
      checkInterval: serviceTable.checkInterval,
      isActive: serviceTable.isActive,
      isPublic: serviceTable.isPublic,
      status: serviceTable.status,
      responseTime: serviceTable.responseTime,
      uptime: serviceTable.uptime,
      lastChecked: serviceTable.lastChecked,
      totalMonitoredTime: serviceTable.totalMonitoredTime,
      onlineTime: serviceTable.onlineTime,
      deletedAt: serviceTable.deletedAt,
      createdAt: serviceTable.createdAt,
      updatedAt: serviceTable.updatedAt,
      logs: sql<typeof serviceLogTable>`(SELECT json_group_array(
        json_object(
          'id', ${serviceLogTable.id},
          'serviceId', ${serviceLogTable.serviceId},
          'status', ${serviceLogTable.status},
          'responseTime', ${serviceLogTable.responseTime},
          'message', ${serviceLogTable.message},
          'timestamp', ${serviceLogTable.timestamp}
        )
      ) FROM ${serviceLogTable} WHERE ${serviceLogTable.serviceId} = ${serviceTable.id} ORDER BY ${serviceLogTable.timestamp} DESC LIMIT 10)`
    })
    .from(serviceTable)
    .where(eq(serviceTable.isDeleted, true))
    .orderBy(desc(serviceTable.deletedAt));
    
    const parsedServices = services.map(s => {
      try {
        return {
          ...s,
          logs: s.logs ? JSON.parse(s.logs) : []
        };
      } catch (error) {
        console.error('Error parsing logs for service', s.id, ':', error);
        return {
          ...s,
          logs: []
        };
      }
    });
    
    res.json(parsedServices);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicios archivados', message: error.message });
  }
});

// Obtener logs recientes de un servicio
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para que Express la reconozca correctamente
router.get('/:id/logs', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200); // Máximo 200 logs
    
    // Verificar que el servicio existe
    const existing = await db.select({ id: serviceTable.id }).from(serviceTable).where(eq(serviceTable.id, serviceId));
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    const logs = await db.select()
      .from(serviceLogTable)
      .where(eq(serviceLogTable.serviceId, serviceId))
      .orderBy(desc(serviceLogTable.timestamp))
      .limit(limit);
    
    res.json({ logs });
  } catch (error) {
    console.error('Error obteniendo logs del servicio:', error);
    res.status(500).json({ error: 'Error al obtener logs', message: error.message });
  }
});

// Obtener métricas de rendimiento históricas de un servicio
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para que Express la reconozca correctamente
router.get('/:id/metrics', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const { range = '24h' } = req.query;
    
    // Calcular fecha de inicio según el rango
    const now = Date.now();
    let startDate;
    
    switch (range) {
      case '1h':
        startDate = now - 60 * 60 * 1000;
        break;
      case '24h':
        startDate = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        startDate = now - 24 * 60 * 60 * 1000;
    }
    
    const metrics = await db.select()
      .from(performanceMetricTable)
      .where(and(
        eq(performanceMetricTable.serviceId, serviceId),
        gte(performanceMetricTable.timestamp, startDate)
      ))
      .orderBy(asc(performanceMetricTable.timestamp));
    
    // Calcular estadísticas agregadas
    const stats = {
      total: metrics.length,
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      uptime: 100,
      onlineCount: 0,
      offlineCount: 0,
      slowCount: 0
    };
    
    if (metrics.length > 0) {
      const responseTimes = metrics.map(m => m.responseTime).filter(rt => rt > 0);
      stats.avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      stats.minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
      stats.maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
      
      metrics.forEach(m => {
        if (m.status === 'online') stats.onlineCount++;
        else if (m.status === 'offline') stats.offlineCount++;
        else if (m.status === 'slow') stats.slowCount++;
      });
      
      const totalChecks = stats.onlineCount + stats.offlineCount + stats.slowCount;
      stats.uptime = totalChecks > 0 ? ((stats.onlineCount + stats.slowCount) / totalChecks * 100).toFixed(2) : 100;
    }
    
    res.json({
      metrics,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ error: 'Error al obtener métricas', message: error.message });
  }
});

// Obtener un servicio por ID
router.get('/:id', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    
    const services = await db.select({
      id: serviceTable.id,
      name: serviceTable.name,
      type: serviceTable.type,
      url: serviceTable.url,
      host: serviceTable.host,
      port: serviceTable.port,
      description: serviceTable.description,
      checkInterval: serviceTable.checkInterval,
      isActive: serviceTable.isActive,
      isPublic: serviceTable.isPublic,
      status: serviceTable.status,
      responseTime: serviceTable.responseTime,
      uptime: serviceTable.uptime,
      lastChecked: serviceTable.lastChecked,
      totalMonitoredTime: serviceTable.totalMonitoredTime,
      onlineTime: serviceTable.onlineTime,
      createdAt: serviceTable.createdAt,
      updatedAt: serviceTable.updatedAt,
      logs: sql<typeof serviceLogTable>`(SELECT json_group_array(
        json_object(
          'id', ${serviceLogTable.id},
          'serviceId', ${serviceLogTable.serviceId},
          'status', ${serviceLogTable.status},
          'responseTime', ${serviceLogTable.responseTime},
          'message', ${serviceLogTable.message},
          'timestamp', ${serviceLogTable.timestamp}
        )
      ) FROM ${serviceLogTable} WHERE ${serviceLogTable.serviceId} = ${serviceTable.id} ORDER BY ${serviceLogTable.timestamp} DESC LIMIT 50)`
    })
    .from(serviceTable)
    .where(eq(serviceTable.id, serviceId));
    
    if (services.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    const service = services[0];
    try {
      service.logs = service.logs ? JSON.parse(service.logs) : [];
    } catch (error) {
      console.error('Error parsing logs for service', service.id, ':', error);
      service.logs = [];
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicio', message: error.message });
  }
});

// Crear un nuevo servicio
router.post('/', async (req, res) => {
  try {
    const { name, type, url, host, port, description, checkInterval, isActive, isPublic, tags, headers, contentMatch } = req.body;
    
    console.log('Creando servicio:', { name, type, url, host, port, tags, headers, contentMatch });
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    // Validar checkInterval (mínimo 10 segundos, máximo 1 hora)
    const interval = checkInterval ? parseInt(checkInterval) : 60;
    if (interval < 10 || interval > 3600) {
      return res.status(400).json({ error: 'El intervalo debe estar entre 10 segundos y 1 hora (3600s)' });
    }
    
    // Validar tipo de servicio
    const validTypes = ['HTTP', 'HTTPS', 'PING', 'DNS', 'TCP', 'SSL'];
    const serviceType = type && validTypes.includes(type) ? type : 'HTTP';
    
    // Determinar URL según el tipo
    let serviceUrl = url;
    if (!serviceUrl && host) {
      serviceUrl = host;
    }
    
    if (!serviceUrl) {
      return res.status(400).json({ error: 'URL o host es requerido' });
    }
    
    // Procesar tags (convertir a JSON string si es array)
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : null;
    
    // Procesar headers (convertir a JSON string si es objeto)
    const headersJson = headers && typeof headers === 'object' ? JSON.stringify(headers) : null;
    
    const now = Date.now();
    const newService = await db.insert(serviceTable).values({
      name,
      type: serviceType,
      url: serviceUrl,
      host: host || null,
      port: port ? parseInt(port) : null,
      description: description || '',
      tags: tagsJson,
      headers: headersJson,
      contentMatch: contentMatch || null,
      checkInterval: interval,
      isActive: isActive !== undefined ? isActive : true,
      isPublic: isPublic !== undefined ? isPublic : false,
      status: 'unknown',
      uptime: 100,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    console.log('Servicio creado:', newService[0]);
    
    // Iniciar monitoreo automático si está activo
    if (newService[0].isActive) {
      startMonitoring(newService[0]);
    }
    
    res.status(201).json(newService[0]);
  } catch (error) {
    console.error('Error creando servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio', message: error.message });
  }
});

// Actualizar un servicio
router.put('/:id', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const { name, type, url, host, port, description, checkInterval, isActive, isPublic, tags } = req.body;
    
    // Obtener el servicio actual
    const existing = await db.select().from(serviceTable).where(eq(serviceTable.id, serviceId));
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    // Validar checkInterval si se proporciona
    let interval;
    if (checkInterval !== undefined) {
      interval = parseInt(checkInterval);
      if (interval < 10 || interval > 3600) {
        return res.status(400).json({ error: 'El intervalo debe estar entre 10 segundos y 1 hora (3600s)' });
      }
    }
    
    // Validar tipo de servicio
    const validTypes = ['HTTP', 'HTTPS', 'PING', 'DNS', 'TCP', 'SSL'];
    
    const updateData = {
      updatedAt: Date.now()
    };
    
    if (name) updateData.name = name;
    if (type && validTypes.includes(type)) updateData.type = type;
    if (url) updateData.url = url;
    if (host !== undefined) updateData.host = host;
    if (port !== undefined) updateData.port = port ? parseInt(port) : null;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : null;
    if (interval) updateData.checkInterval = interval;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    
    const updatedService = await db.update(serviceTable)
      .set(updateData)
      .where(eq(serviceTable.id, serviceId))
      .returning();
    
    // Manejar el monitoreo según el estado
    if (isActive !== undefined) {
      if (isActive) {
        startMonitoring(updatedService[0]);
      } else {
        stopMonitoring(serviceId);
      }
    } else if (updatedService[0].isActive && (checkInterval || url || type)) {
      // Si cambió el intervalo, URL o tipo, reiniciar monitoreo
      startMonitoring(updatedService[0]);
    }
    
    res.json(updatedService[0]);
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    res.status(500).json({ error: 'Error al actualizar servicio', message: error.message });
  }
});

// Archivar un servicio (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    
    // Detener monitoreo antes de archivar
    stopMonitoring(serviceId);
    
    // Soft delete - marcar como eliminado pero mantener en BD
    await db.update(serviceTable)
      .set({
        isDeleted: true,
        deletedAt: Date.now(),
        isActive: false, // Desactivar monitoreo
        updatedAt: Date.now()
      })
      .where(eq(serviceTable.id, serviceId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error archivando servicio:', error);
    res.status(500).json({ error: 'Error al archivar servicio', message: error.message });
  }
});

// Restaurar un servicio archivado
router.post('/:id/restore', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    
    const updated = await db.update(serviceTable)
      .set({
        isDeleted: false,
        deletedAt: null,
        isActive: true,
        updatedAt: Date.now()
      })
      .where(eq(serviceTable.id, serviceId))
      .returning();
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    // Reiniciar monitoreo
    if (updated[0].isActive) {
      startMonitoring(updated[0]);
    }
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Error restaurando servicio:', error);
    res.status(500).json({ error: 'Error al restaurar servicio', message: error.message });
  }
});

// Eliminar permanentemente un servicio (hard delete)
router.delete('/:id/permanent', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    
    // Detener monitoreo
    stopMonitoring(serviceId);
    
    // Eliminar logs primero (por foreign key)
    await db.delete(serviceLogTable).where(eq(serviceLogTable.serviceId, serviceId));
    await db.delete(performanceMetricTable).where(eq(performanceMetricTable.serviceId, serviceId));
    
    // Eliminar el servicio
    await db.delete(serviceTable).where(eq(serviceTable.id, serviceId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    res.status(500).json({ error: 'Error al eliminar servicio permanentemente', message: error.message });
  }
});

// Verificar el estado de un servicio (manual)
router.post('/:id/check', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    
    const existing = await db.select().from(serviceTable).where(eq(serviceTable.id, serviceId));
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    const service = existing[0];
    const result = await checkService(service);
    const now = Date.now();
    
    // Calcular uptime basado en el estado actual
    let newUptime = service.uptime || 100;
    let totalMonitoredTime = service.totalMonitoredTime || 0;
    let onlineTime = service.onlineTime || 0;
    
    const lastChecked = service.lastChecked;
    if (lastChecked) {
      const timeSinceLastCheck = now - lastChecked;
      totalMonitoredTime = totalMonitoredTime + timeSinceLastCheck;
      // Consideramos "online" tanto el estado 'online' como 'degraded' (funciona pero con problemas)
      const wasOnlineOrDegraded = result.status === 'online' || result.status === 'degraded';
      onlineTime = onlineTime + (wasOnlineOrDegraded ? timeSinceLastCheck : 0);
      newUptime = totalMonitoredTime > 0 ? (onlineTime / totalMonitoredTime) * 100 : 100;
    } else {
      // Primera verificación - consideramos online tanto 'online' como 'degraded'
      newUptime = (result.status === 'online' || result.status === 'degraded') ? 100 : 0;
    }
    
    const updatedService = await db.update(serviceTable)
      .set({
        status: result.status,
        responseTime: result.responseTime,
        lastChecked: now,
        uptime: newUptime,
        totalMonitoredTime: totalMonitoredTime,
        onlineTime: onlineTime,
        updatedAt: now
      })
      .where(eq(serviceTable.id, service.id))
      .returning();
    
    // Crear log
    await db.insert(serviceLogTable).values({
      serviceId: service.id,
      status: result.status,
      responseTime: result.responseTime,
      message: result.message,
      timestamp: now
    });
    
    // Obtener logs para la respuesta
    const logs = await db.select().from(serviceLogTable)
      .where(eq(serviceLogTable.serviceId, service.id))
      .orderBy(desc(serviceLogTable.timestamp))
      .limit(10);
    
    res.json({
      ...updatedService[0],
      logs
    });
  } catch (error) {
    console.error('Error verificando servicio:', error);
    res.status(500).json({ error: 'Error al verificar servicio', message: error.message });
  }
});

// Verificar todos los servicios (manual)
router.post('/check-all', async (req, res) => {
  try {
    const allServices = await db.select().from(serviceTable);
    
    for (const service of allServices) {
      const result = await checkService(service);
      const now = Date.now();
      
      // Calcular uptime basado en el estado actual
      let newUptime = service.uptime || 100;
      let totalMonitoredTime = service.totalMonitoredTime || 0;
      let onlineTime = service.onlineTime || 0;
      
      const lastChecked = service.lastChecked;
      if (lastChecked) {
        const timeSinceLastCheck = now - lastChecked;
        totalMonitoredTime = totalMonitoredTime + timeSinceLastCheck;
        const wasOnlineOrDegraded = result.status === 'online' || result.status === 'degraded';
        onlineTime = onlineTime + (wasOnlineOrDegraded ? timeSinceLastCheck : 0);
        newUptime = totalMonitoredTime > 0 ? (onlineTime / totalMonitoredTime) * 100 : 100;
      } else {
        newUptime = (result.status === 'online' || result.status === 'degraded') ? 100 : 0;
      }
      
      await db.update(serviceTable)
        .set({
          status: result.status,
          responseTime: result.responseTime,
          lastChecked: now,
          uptime: newUptime,
          totalMonitoredTime: totalMonitoredTime,
          onlineTime: onlineTime,
          updatedAt: now
        })
        .where(eq(serviceTable.id, service.id));
      
      await db.insert(serviceLogTable).values({
        serviceId: service.id,
        status: result.status,
        responseTime: result.responseTime,
        message: result.message,
        timestamp: now
      });
    }
    
    // Obtener servicios con sus logs
    const services = await db.select({
      id: serviceTable.id,
      name: serviceTable.name,
      type: serviceTable.type,
      url: serviceTable.url,
      host: serviceTable.host,
      port: serviceTable.port,
      description: serviceTable.description,
      checkInterval: serviceTable.checkInterval,
      isActive: serviceTable.isActive,
      isPublic: serviceTable.isPublic,
      status: serviceTable.status,
      responseTime: serviceTable.responseTime,
      uptime: serviceTable.uptime,
      lastChecked: serviceTable.lastChecked,
      totalMonitoredTime: serviceTable.totalMonitoredTime,
      onlineTime: serviceTable.onlineTime,
      createdAt: serviceTable.createdAt,
      updatedAt: serviceTable.updatedAt,
      logs: sql<typeof serviceLogTable>`(SELECT json_group_array(
        json_object(
          'id', ${serviceLogTable.id},
          'serviceId', ${serviceLogTable.serviceId},
          'status', ${serviceLogTable.status},
          'responseTime', ${serviceLogTable.responseTime},
          'message', ${serviceLogTable.message},
          'timestamp', ${serviceLogTable.timestamp}
        )
      ) FROM ${serviceLogTable} WHERE ${serviceLogTable.serviceId} = ${serviceTable.id} ORDER BY ${serviceLogTable.timestamp} DESC LIMIT 10)`
    })
    .from(serviceTable)
    .orderBy(desc(serviceTable.createdAt));
    
    const parsedServices = services.map(s => {
      try {
        return {
          ...s,
          logs: s.logs ? JSON.parse(s.logs) : []
        };
      } catch (error) {
        console.error('Error parsing logs for service', s.id, ':', error);
        return {
          ...s,
          logs: []
        };
      }
    });
    
    res.json(parsedServices);
  } catch (error) {
    console.error('Error verificando todos los servicios:', error);
    res.status(500).json({ error: 'Error al verificar servicios', message: error.message });
  }
});

// Toggle monitoreo activo/inactivo
router.post('/:id/toggle', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    
    const existing = await db.select().from(serviceTable).where(eq(serviceTable.id, serviceId));
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    const service = existing[0];
    const newIsActive = !service.isActive;
    
    const updatedService = await db.update(serviceTable)
      .set({
        isActive: newIsActive,
        updatedAt: Date.now()
      })
      .where(eq(serviceTable.id, serviceId))
      .returning();
    
    // Iniciar o detener monitoreo
    if (newIsActive) {
      startMonitoring(updatedService[0]);
    } else {
      stopMonitoring(serviceId);
    }
    
    res.json(updatedService[0]);
  } catch (error) {
    console.error('Error toggling servicio:', error);
    res.status(500).json({ error: 'Error al cambiar estado del servicio', message: error.message });
  }
});

export default router;
