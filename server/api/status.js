import express from 'express';
import { db, services as serviceTable, serviceLogs as serviceLogTable, maintenanceWindows } from '../lib/db.js';
import { eq, desc, gte, lte, sql, and } from 'drizzle-orm';

const router = express.Router();

// Rate limiting simple (en memoria)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 30; // 30 requests por minuto

const checkRateLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Limpiar entradas antiguas
  for (const [key, data] of rateLimit.entries()) {
    if (data.timestamp < windowStart) {
      rateLimit.delete(key);
    }
  }
  
  const current = rateLimit.get(ip) || { count: 0, timestamp: now };
  
  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  current.count++;
  current.timestamp = now;
  rateLimit.set(ip, current);
  
  return true;
};

// Middleware de rate limiting
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }
  
  next();
};

// Obtener estado público de todos los servicios (sin logs detallados)
router.get('/', rateLimitMiddleware, async (req, res) => {
  try {
    const services = await db.select({
      id: serviceTable.id,
      name: serviceTable.name,
      type: serviceTable.type,
      url: serviceTable.url,
      description: serviceTable.description,
      status: serviceTable.status,
      responseTime: serviceTable.responseTime,
      uptime: serviceTable.uptime,
      lastChecked: serviceTable.lastChecked,
      sslExpiryDate: serviceTable.sslExpiryDate,
      sslDaysRemaining: serviceTable.sslDaysRemaining,
      createdAt: serviceTable.createdAt
    })
    .from(serviceTable)
    .where(and(
      eq(serviceTable.isDeleted, false),
      eq(serviceTable.isActive, true),
      eq(serviceTable.isPublic, true)
    ))
    .orderBy(desc(serviceTable.createdAt));
    
    // Calcular estadísticas generales
    const totalServices = services.length;
    const onlineServices = services.filter(s => s.status === 'online').length;
    const offlineServices = services.filter(s => s.status === 'offline').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    const unknownServices = services.filter(s => s.status === 'unknown').length;
    
    const overallStatus = offlineServices > 0 ? 'partial_outage' : 
                         degradedServices > 0 ? 'degraded' : 
                         onlineServices === totalServices && totalServices > 0 ? 'operational' : 
                         'unknown';
    
    const averageUptime = services.length > 0 
      ? services.reduce((acc, s) => acc + (s.uptime || 0), 0) / services.length 
      : 100;
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      summary: {
        total: totalServices,
        online: onlineServices,
        offline: offlineServices,
        degraded: degradedServices,
        unknown: unknownServices,
        averageUptime: Math.round(averageUptime * 100) / 100
      },
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        url: s.url,
        description: s.description,
        status: s.status,
        responseTime: s.responseTime,
        uptime: s.uptime,
        lastChecked: s.lastChecked
      }))
    });
  } catch (error) {
    console.error('Error al obtener estado público:', error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
});

// Obtener historial de incidentes (últimos 7 días)
router.get('/incidents', rateLimitMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const logs = await db.select({
      id: serviceLogTable.id,
      serviceId: serviceLogTable.serviceId,
      timestamp: serviceLogTable.timestamp,
      status: serviceLogTable.status,
      message: serviceLogTable.message,
      serviceName: serviceTable.name,
      serviceUrl: serviceTable.url
    })
    .from(serviceLogTable)
    .innerJoin(serviceTable, eq(serviceLogTable.serviceId, serviceTable.id))
    .where(and(
      gte(serviceLogTable.timestamp, sevenDaysAgo),
      sql`${serviceLogTable.status} IN ('offline', 'error')`,
      eq(serviceTable.isPublic, true)
    ))
    .orderBy(desc(serviceLogTable.timestamp))
    .limit(50);
    
    // Agrupar por día
    const incidentsByDay = logs.reduce((acc, log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        service: log.serviceName,
        status: log.status,
        message: log.message,
        timestamp: log.timestamp
      });
      return acc;
    }, {});
    
    res.json({
      period: 'last_7_days',
      totalIncidents: logs.length,
      incidentsByDay
    });
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({ error: 'Error al obtener incidentes' });
  }
});

// Obtener mantenimientos activos y programados (público)
router.get('/maintenance', rateLimitMiddleware, async (req, res) => {
  try {
    const now = new Date().toISOString();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Mantenimientos activos (ahora mismo)
    const activeMaintenanceResults = await db.select({
      window: maintenanceWindows,
      service: serviceTable
    })
    .from(maintenanceWindows)
    .leftJoin(serviceTable, eq(maintenanceWindows.serviceId, serviceTable.id))
    .where(and(
      lte(maintenanceWindows.startTime, now),
      gte(maintenanceWindows.endTime, now),
      eq(maintenanceWindows.isActive, true)
    ))
    .orderBy(desc(maintenanceWindows.startTime));
    
    // Mantenimientos programados (próximos 30 días)
    const upcomingMaintenanceResults = await db.select({
      window: maintenanceWindows,
      service: serviceTable
    })
    .from(maintenanceWindows)
    .leftJoin(serviceTable, eq(maintenanceWindows.serviceId, serviceTable.id))
    .where(and(
      gte(maintenanceWindows.startTime, now),
      lte(maintenanceWindows.startTime, thirtyDaysFromNow),
      eq(maintenanceWindows.isActive, true)
    ))
    .orderBy(maintenanceWindows.startTime);
    
    const formatWindow = (r) => ({
      id: r.window.id,
      title: r.window.title,
      description: r.window.description,
      startTime: r.window.startTime,
      endTime: r.window.endTime,
      isRecurring: Boolean(r.window.isRecurring),
      service: r.service ? {
        id: r.service.id,
        name: r.service.name,
        type: r.service.type
      } : null
    });
    
    res.json({
      active: activeMaintenanceResults.map(formatWindow),
      upcoming: upcomingMaintenanceResults.map(formatWindow),
      hasActiveMaintenances: activeMaintenanceResults.length > 0
    });
  } catch (error) {
    console.error('Error al obtener mantenimientos:', error);
    res.status(500).json({ error: 'Error al obtener mantenimientos' });
  }
});

// Obtener histórico de uptime (90 días)
router.get('/history', rateLimitMiddleware, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 90, 90);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Obtener todos los servicios públicos
    const publicServices = await db.select({
      id: serviceTable.id,
      name: serviceTable.name,
      type: serviceTable.type,
      uptime: serviceTable.uptime,
      createdAt: serviceTable.createdAt
    })
    .from(serviceTable)
    .where(and(
      eq(serviceTable.isDeleted, false),
      eq(serviceTable.isActive, true),
      eq(serviceTable.isPublic, true)
    ));
    
    // Para cada servicio, obtener historial de logs agrupados por día
    const historyByService = await Promise.all(
      publicServices.map(async (service) => {
        const logs = await db.select({
          timestamp: serviceLogTable.timestamp,
          status: serviceLogTable.status,
          responseTime: serviceLogTable.responseTime
        })
        .from(serviceLogTable)
        .where(and(
          eq(serviceLogTable.serviceId, service.id),
          gte(serviceLogTable.timestamp, startDate.toISOString())
        ))
        .orderBy(serviceLogTable.timestamp);
        
        // Agrupar por día y calcular uptime diario
        const dailyStats = {};
        
        logs.forEach(log => {
          const date = new Date(log.timestamp).toISOString().split('T')[0];
          if (!dailyStats[date]) {
            dailyStats[date] = { total: 0, online: 0, avgResponseTime: 0, responseTimes: [] };
          }
          dailyStats[date].total++;
          if (log.status === 'online') {
            dailyStats[date].online++;
          }
          if (log.responseTime) {
            dailyStats[date].responseTimes.push(log.responseTime);
          }
        });
        
        // Calcular promedios
        const dailyHistory = Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          uptime: stats.total > 0 ? (stats.online / stats.total) * 100 : 100,
          avgResponseTime: stats.responseTimes.length > 0 
            ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
            : null,
          checksCount: stats.total
        })).sort((a, b) => a.date.localeCompare(b.date));
        
        // Calcular uptime general del período
        const totalChecks = logs.length;
        const onlineChecks = logs.filter(l => l.status === 'online').length;
        const periodUptime = totalChecks > 0 ? (onlineChecks / totalChecks) * 100 : 100;
        
        return {
          service: {
            id: service.id,
            name: service.name,
            type: service.type
          },
          periodUptime: Math.round(periodUptime * 100) / 100,
          dailyHistory
        };
      })
    );
    
    // Calcular uptime promedio global por día
    const allDates = new Set();
    historyByService.forEach(s => s.dailyHistory.forEach(d => allDates.add(d.date)));
    
    const globalDailyUptime = Array.from(allDates).sort().map(date => {
      const dayData = historyByService
        .map(s => s.dailyHistory.find(d => d.date === date))
        .filter(Boolean);
      
      const avgUptime = dayData.length > 0
        ? dayData.reduce((acc, d) => acc + d.uptime, 0) / dayData.length
        : 100;
      
      return {
        date,
        uptime: Math.round(avgUptime * 100) / 100,
        servicesCount: dayData.length
      };
    });
    
    res.json({
      period: `last_${days}_days`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      globalDailyUptime,
      serviceHistory: historyByService
    });
  } catch (error) {
    console.error('Error al obtener histórico:', error);
    res.status(500).json({ error: 'Error al obtener histórico' });
  }
});

export default router;
