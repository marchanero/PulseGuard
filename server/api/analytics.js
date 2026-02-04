import express from 'express';
import { eq, and, gte, inArray, desc } from 'drizzle-orm';
import { db, services, serviceLogs } from '../db/index.js';

const router = express.Router();

// Obtener datos para el heatmap de disponibilidad (últimos 90 días)
router.get('/heatmap/:id', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const days = parseInt(req.query.days) || 90;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Obtener logs del período
    const logs = await db.select().from(serviceLogs)
      .where(and(
        eq(serviceLogs.serviceId, serviceId),
        gte(serviceLogs.timestamp, startDate.toISOString())
      ))
      .orderBy(serviceLogs.timestamp);
    
    // Agrupar por día
    const dailyStats = {};
    
    // Inicializar todos los días
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = {
        date: dateKey,
        total: 0,
        online: 0,
        offline: 0,
        uptime: 100
      };
    }
    
    // Contar checks por día
    logs.forEach(log => {
      const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].total++;
        if (log.status === 'online') {
          dailyStats[dateKey].online++;
        } else {
          dailyStats[dateKey].offline++;
        }
      }
    });
    
    // Calcular uptime por día
    Object.values(dailyStats).forEach(day => {
      if (day.total > 0) {
        day.uptime = (day.online / day.total) * 100;
      }
    });
    
    res.json({
      serviceId,
      days,
      data: Object.values(dailyStats).reverse()
    });
  } catch (error) {
    console.error('Error al obtener heatmap:', error);
    res.status(500).json({ error: 'Error al obtener datos del heatmap' });
  }
});

// Obtener uptime histórico (últimos 30, 60, 90 días)
router.get('/uptime-history/:id', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const periods = [7, 30, 60, 90];
    
    const result = {};
    
    for (const days of periods) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const logs = await db.select().from(serviceLogs)
        .where(and(
          eq(serviceLogs.serviceId, serviceId),
          gte(serviceLogs.timestamp, startDate.toISOString())
        ));
      
      const total = logs.length;
      const online = logs.filter(l => l.status === 'online').length;
      
      result[`${days}d`] = {
        days,
        uptime: total > 0 ? (online / total) * 100 : 100,
        checks: total
      };
    }
    
    res.json({
      serviceId,
      periods: result
    });
  } catch (error) {
    console.error('Error al obtener uptime histórico:', error);
    res.status(500).json({ error: 'Error al obtener uptime histórico' });
  }
});

// Obtener timeline de eventos (cambios de estado)
router.get('/timeline/:id', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = await db.select().from(serviceLogs)
      .where(eq(serviceLogs.serviceId, serviceId))
      .orderBy(desc(serviceLogs.timestamp))
      .limit(limit);
    
    // Detectar cambios de estado
    const events = [];
    let lastStatus = null;
    
    // Procesar en orden cronológico inverso
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      
      if (lastStatus !== null && lastStatus !== log.status) {
        // Hubo un cambio de estado
        events.push({
          timestamp: log.timestamp,
          from: lastStatus,
          to: log.status,
          duration: events.length > 0 
            ? Math.floor((new Date(events[events.length - 1].timestamp) - new Date(log.timestamp)) / 1000)
            : null
        });
      }
      
      lastStatus = log.status;
    }
    
    res.json({
      serviceId,
      events: events.reverse()
    });
  } catch (error) {
    console.error('Error al obtener timeline:', error);
    res.status(500).json({ error: 'Error al obtener timeline' });
  }
});

// Obtener resumen de incidentes
router.get('/incidents/:id', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const days = parseInt(req.query.days) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logs = await db.select().from(serviceLogs)
      .where(and(
        eq(serviceLogs.serviceId, serviceId),
        gte(serviceLogs.timestamp, startDate.toISOString()),
        inArray(serviceLogs.status, ['offline', 'error'])
      ))
      .orderBy(desc(serviceLogs.timestamp));
    
    // Agrupar incidentes consecutivos
    const incidents = [];
    let currentIncident = null;
    
    logs.forEach(log => {
      if (!currentIncident || 
          (new Date(currentIncident.start) - new Date(log.timestamp)) > 5 * 60 * 1000) {
        // Nuevo incidente (más de 5 minutos desde el anterior)
        if (currentIncident) {
          incidents.push(currentIncident);
        }
        currentIncident = {
          id: log.id,
          start: log.timestamp,
          end: log.timestamp,
          duration: 0,
          message: log.message
        };
      } else {
        // Continuación del incidente actual
        currentIncident.start = log.timestamp;
        currentIncident.duration = Math.floor(
          (new Date(currentIncident.end) - new Date(currentIncident.start)) / 1000
        );
      }
    });
    
    if (currentIncident) {
      incidents.push(currentIncident);
    }
    
    res.json({
      serviceId,
      days,
      totalIncidents: incidents.length,
      totalDowntime: incidents.reduce((acc, i) => acc + i.duration, 0),
      incidents
    });
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({ error: 'Error al obtener incidentes' });
  }
});

// Estadísticas globales del dashboard
router.get('/dashboard-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Total de servicios
    const allServices = await db.select().from(services)
      .where(eq(services.isDeleted, false));
    const totalServices = allServices.length;
    
    // Servicios online
    const onlineServices = allServices.filter(s => s.status === 'online').length;
    
    // Logs del período
    const logs = await db.select().from(serviceLogs)
      .where(gte(serviceLogs.timestamp, startDate.toISOString()));
    
    const totalChecks = logs.length;
    const successfulChecks = logs.filter(l => l.status === 'online').length;
    const overallUptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
    
    // Incidentes del período
    const incidents = logs.filter(l => l.status === 'offline' || l.status === 'error').length;
    
    // Promedio de response time
    const responseTimes = logs
      .filter(l => l.responseTime)
      .map(l => l.responseTime);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    res.json({
      days,
      services: {
        total: totalServices,
        online: onlineServices,
        offline: totalServices - onlineServices
      },
      checks: {
        total: totalChecks,
        successful: successfulChecks,
        failed: totalChecks - successfulChecks
      },
      uptime: overallUptime,
      incidents,
      avgResponseTime: Math.round(avgResponseTime)
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
