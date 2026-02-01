import express from 'express';
import prisma from '../lib/prisma.js';

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
    const services = await prisma.service.findMany({
      where: { 
        isDeleted: false,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        description: true,
        status: true,
        responseTime: true,
        uptime: true,
        lastChecked: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const logs = await prisma.serviceLog.findMany({
      where: {
        timestamp: {
          gte: sevenDaysAgo
        },
        status: {
          in: ['offline', 'error']
        }
      },
      include: {
        service: {
          select: {
            name: true,
            url: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50
    });
    
    // Agrupar por día
    const incidentsByDay = logs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        service: log.service.name,
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