import prisma from '../lib/prisma.js';
import { checkServiceHealth } from './healthCheck.js';

// Mapa para almacenar los intervalos activos
const activeIntervals = new Map();

// Función para verificar un servicio y actualizar su estado
async function monitorService(serviceId) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service || !service.isActive) {
      // Si el servicio no existe o está inactivo, detener el monitoreo
      stopMonitoring(serviceId);
      return;
    }

    const result = await checkServiceHealth(service.url);

    // Actualizar el servicio con los nuevos datos
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: result.status,
        responseTime: result.responseTime,
        lastChecked: new Date()
      }
    });

    // Crear log
    await prisma.serviceLog.create({
      data: {
        serviceId: serviceId,
        status: result.status,
        responseTime: result.responseTime,
        message: result.message
      }
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
    const services = await prisma.service.findMany({
      where: { isActive: true }
    });

    console.log(`[Monitor] Iniciando monitoreo de ${services.length} servicios`);

    for (const service of services) {
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
