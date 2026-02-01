import express from 'express';
import prisma from '../lib/prisma.js';
import { checkService } from '../utils/checkTypes.js';
import { startMonitoring, stopMonitoring } from '../utils/monitor.js';

const router = express.Router();

// Obtener todos los servicios activos (no eliminados)
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isDeleted: false },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicios', message: error.message });
  }
});

// Obtener servicios archivados (eliminados)
router.get('/archived', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isDeleted: true },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { deletedAt: 'desc' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicios archivados', message: error.message });
  }
});

// Obtener un servicio por ID
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    });
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicio', message: error.message });
  }
});

// Crear un nuevo servicio
router.post('/', async (req, res) => {
  try {
    const { name, type, url, host, port, description, checkInterval, isActive } = req.body;
    
    console.log('Creando servicio:', { name, type, url, host, port });
    
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
    
    const newService = await prisma.service.create({
      data: {
        name,
        type: serviceType,
        url: serviceUrl,
        host: host || null,
        port: port ? parseInt(port) : null,
        description: description || '',
        checkInterval: interval,
        isActive: isActive !== undefined ? isActive : true,
        status: 'unknown',
        uptime: 100
      }
    });
    
    console.log('Servicio creado:', newService);
    
    // Iniciar monitoreo automático si está activo
    if (newService.isActive) {
      startMonitoring(newService);
    }
    
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error creando servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio', message: error.message });
  }
});

// Actualizar un servicio
router.put('/:id', async (req, res) => {
  try {
    const { name, type, url, host, port, description, checkInterval, isActive } = req.body;
    
    // Obtener el servicio actual
    const currentService = await prisma.service.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!currentService) {
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
    
    const updatedService = await prisma.service.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(type && validTypes.includes(type) && { type }),
        ...(url && { url }),
        ...(host !== undefined && { host }),
        ...(port !== undefined && { port: port ? parseInt(port) : null }),
        ...(description !== undefined && { description }),
        ...(interval && { checkInterval: interval }),
        ...(isActive !== undefined && { isActive })
      }
    });
    
    // Manejar el monitoreo según el estado
    if (isActive !== undefined) {
      if (isActive) {
        startMonitoring(updatedService);
      } else {
        stopMonitoring(updatedService.id);
      }
    } else if (updatedService.isActive && (checkInterval || url || type)) {
      // Si cambió el intervalo, URL o tipo, reiniciar monitoreo
      startMonitoring(updatedService);
    }
    
    res.json(updatedService);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
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
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false // Desactivar monitoreo
      }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.status(500).json({ error: 'Error al archivar servicio', message: error.message });
  }
});

// Restaurar un servicio archivado
router.post('/:id/restore', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        isDeleted: false,
        deletedAt: null,
        isActive: true
      }
    });
    
    // Reiniciar monitoreo
    if (service.isActive) {
      startMonitoring(service);
    }
    
    res.json(service);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.status(500).json({ error: 'Error al restaurar servicio', message: error.message });
  }
});

// Eliminar permanentemente un servicio (hard delete)
router.delete('/:id/permanent', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    
    // Detener monitoreo
    stopMonitoring(serviceId);
    
    // Eliminar permanentemente
    await prisma.service.delete({
      where: { id: serviceId }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.status(500).json({ error: 'Error al eliminar servicio permanentemente', message: error.message });
  }
});

// Verificar el estado de un servicio (manual)
router.post('/:id/check', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    const result = await checkService(service);
    const now = new Date();
    
    // Calcular uptime basado en el estado actual
    let newUptime = service.uptime || 100;
    let totalMonitoredTime = service.totalMonitoredTime || 0;
    let onlineTime = service.onlineTime || 0;
    
    const lastChecked = service.lastChecked;
    if (lastChecked) {
      const timeSinceLastCheck = now - new Date(lastChecked);
      totalMonitoredTime = totalMonitoredTime + timeSinceLastCheck;
      // Consideramos "online" tanto el estado 'online' como 'degraded' (funciona pero con problemas)
      const wasOnlineOrDegraded = result.status === 'online' || result.status === 'degraded';
      onlineTime = onlineTime + (wasOnlineOrDegraded ? timeSinceLastCheck : 0);
      newUptime = totalMonitoredTime > 0 ? (onlineTime / totalMonitoredTime) * 100 : 100;
    } else {
      // Primera verificación - consideramos online tanto 'online' como 'degraded'
      newUptime = (result.status === 'online' || result.status === 'degraded') ? 100 : 0;
    }
    
    const updatedService = await prisma.service.update({
      where: { id: service.id },
      data: {
        status: result.status,
        responseTime: result.responseTime,
        lastChecked: now,
        uptime: newUptime,
        totalMonitoredTime: totalMonitoredTime,
        onlineTime: onlineTime
      },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });
    
    // Crear log
    await prisma.serviceLog.create({
      data: {
        serviceId: service.id,
        status: result.status,
        responseTime: result.responseTime,
        message: result.message
      }
    });
    
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar servicio', message: error.message });
  }
});

// Verificar todos los servicios (manual)
router.post('/check-all', async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    
    await Promise.all(
      services.map(async (service) => {
        const result = await checkService(service);
        const now = new Date();
        
        // Calcular uptime basado en el estado actual
        let newUptime = service.uptime || 100;
        let totalMonitoredTime = service.totalMonitoredTime || 0;
        let onlineTime = service.onlineTime || 0;
        
        const lastChecked = service.lastChecked;
        if (lastChecked) {
      const timeSinceLastCheck = now - new Date(lastChecked);
      totalMonitoredTime = totalMonitoredTime + timeSinceLastCheck;
      // Consideramos "online" tanto el estado 'online' como 'degraded' (funciona pero con problemas)
      const wasOnlineOrDegraded = result.status === 'online' || result.status === 'degraded';
      onlineTime = onlineTime + (wasOnlineOrDegraded ? timeSinceLastCheck : 0);
      newUptime = totalMonitoredTime > 0 ? (onlineTime / totalMonitoredTime) * 100 : 100;
    } else {
      // Primera verificación - consideramos online tanto 'online' como 'degraded'
      newUptime = (result.status === 'online' || result.status === 'degraded') ? 100 : 0;
    }
        
        await prisma.service.update({
          where: { id: service.id },
          data: {
            status: result.status,
            responseTime: result.responseTime,
            lastChecked: now,
            uptime: newUptime,
            totalMonitoredTime: totalMonitoredTime,
            onlineTime: onlineTime
          }
        });
        
        await prisma.serviceLog.create({
          data: {
            serviceId: service.id,
            status: result.status,
            responseTime: result.responseTime,
            message: result.message
          }
        });
      })
    );
    
    // Obtener servicios con sus logs
    const servicesWithLogs = await prisma.service.findMany({
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(servicesWithLogs);
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar servicios', message: error.message });
  }
});

// Toggle monitoreo activo/inactivo
router.post('/:id/toggle', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    const newIsActive = !service.isActive;
    
    const updatedService = await prisma.service.update({
      where: { id: service.id },
      data: { isActive: newIsActive }
    });
    
    // Iniciar o detener monitoreo
    if (newIsActive) {
      startMonitoring(updatedService);
    } else {
      stopMonitoring(updatedService.id);
    }
    
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar estado del servicio', message: error.message });
  }
});

// Obtener métricas de rendimiento históricas de un servicio
router.get('/:id/metrics', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const { range = '24h' } = req.query;
    
    // Calcular fecha de inicio según el rango
    const now = new Date();
    let startDate;
    
    switch (range) {
      case '1h':
        startDate = new Date(now - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 24 * 60 * 60 * 1000);
    }
    
    const metrics = await prisma.performanceMetric.findMany({
      where: {
        serviceId: serviceId,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
    
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
      stats.minResponseTime = Math.min(...responseTimes);
      stats.maxResponseTime = Math.max(...responseTimes);
      
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
      stats,
      range
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener métricas', message: error.message });
  }
});

export default router;
