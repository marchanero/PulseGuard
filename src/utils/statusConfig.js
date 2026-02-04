import { Activity, Clock, Shield, AlertTriangle, Zap } from 'lucide-react';

/**
 * Configuración de estados de servicios
 * Centraliza la lógica de colores y textos por estado
 */
export const STATUS_CONFIGS = {
  online: {
    color: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    label: 'Online',
    icon: Shield,
    description: 'Operativo',
    indicator: 'bg-emerald-500'
  },
  offline: {
    color: 'bg-red-500',
    gradient: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Offline',
    icon: AlertTriangle,
    description: 'No disponible',
    indicator: 'bg-red-500'
  },
  degraded: {
    color: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Degradado',
    icon: Zap,
    description: 'Rendimiento reducido',
    indicator: 'bg-amber-500'
  },
  timeout: {
    color: 'bg-orange-500',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Timeout',
    icon: Clock,
    description: 'Tiempo excedido',
    indicator: 'bg-orange-500'
  },
  unknown: {
    color: 'bg-slate-400',
    gradient: 'from-slate-400 to-gray-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-700',
    label: 'Desconocido',
    icon: Activity,
    description: 'Sin datos',
    indicator: 'bg-slate-400'
  }
};

/**
 * Obtiene la configuración de estado
 * @param {string} status - Estado del servicio
 * @returns {object} Configuración del estado
 */
export function getStatusConfig(status) {
  return STATUS_CONFIGS[status] || STATUS_CONFIGS.unknown;
}

/**
 * Obtiene el color para un valor de latencia
 * @param {number} ms - Latencia en milisegundos
 * @returns {string} Clase de color
 */
export function getLatencyColor(ms) {
  if (!ms) return 'text-slate-500';
  if (ms < 100) return 'text-emerald-600 dark:text-emerald-400';
  if (ms < 300) return 'text-green-600 dark:text-green-400';
  if (ms < 500) return 'text-amber-600 dark:text-amber-400';
  if (ms < 1000) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Obtiene el color para un valor de uptime
 * @param {number} uptime - Uptime en porcentaje
 * @returns {string} Clase de color
 */
export function getUptimeColor(uptime) {
  if (uptime >= 99.9) return 'text-emerald-600 dark:text-emerald-400';
  if (uptime >= 99) return 'text-green-600 dark:text-green-400';
  if (uptime >= 95) return 'text-amber-600 dark:text-amber-400';
  if (uptime >= 90) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}
