import express from 'express';
import { eq, and, gte, inArray, desc } from 'drizzle-orm';
import { db, services, serviceLogs } from '../db/index.js';

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
    const allServices = await db.select({
      id: services.id,
      name: services.name,
      type: services.type,
      url: services.url,
      description: services.description,
      status: services.status,
      responseTime: services.responseTime,
      uptime: services.uptime,
      lastChecked: services.lastChecked,
      createdAt: services.createdAt,
    }).from(services)
      .where(and(
        eq(services.isDeleted, false),
        eq(services.isActive, true)
      ))
      .orderBy(desc(services.createdAt));
    
    // Calcular estadísticas generales
    const totalServices = allServices.length;
    const onlineServices = allServices.filter(s => s.status === 'online').length;
    const offlineServices = allServices.filter(s => s.status === 'offline').length;
    const degradedServices = allServices.filter(s => s.status === 'degraded').length;
    const unknownServices = allServices.filter(s => s.status === 'unknown').length;
    
    const overallStatus = offlineServices > 0 ? 'partial_outage' : 
                         degradedServices > 0 ? 'degraded' : 
                         onlineServices === totalServices && totalServices > 0 ? 'operational' : 
                         'unknown';
    
    const averageUptime = allServices.length > 0 
      ? allServices.reduce((acc, s) => acc + (s.uptime || 0), 0) / allServices.length 
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
      services: allServices.map(s => ({
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Obtener logs con información del servicio
    const logs = await db.select({
      id: serviceLogs.id,
      serviceId: serviceLogs.serviceId,
      timestamp: serviceLogs.timestamp,
      status: serviceLogs.status,
      message: serviceLogs.message,
      serviceName: services.name,
      serviceUrl: services.url,
    })
      .from(serviceLogs)
      .innerJoin(services, eq(serviceLogs.serviceId, services.id))
      .where(and(
        gte(serviceLogs.timestamp, sevenDaysAgo.toISOString()),
        inArray(serviceLogs.status, ['offline', 'error'])
      ))
      .orderBy(desc(serviceLogs.timestamp))
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

export default router;
