/**
 * Utilidades de formateo compartidas
 * Evita duplicación de código entre componentes
 */

/**
 * Formatea una fecha relativa al momento actual
 * @param {string|Date} dateString - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return 'Sin datos';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Hace un momento';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)}h`;
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea tiempo de respuesta en ms o segundos
 * @param {number} ms - Milisegundos
 * @returns {string} Tiempo formateado
 */
export function formatResponseTime(ms) {
  if (!ms && ms !== 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Formatea intervalo en segundos a formato legible
 * @param {number} seconds - Segundos
 * @returns {string} Intervalo formateado
 */
export function formatInterval(seconds) {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds === 60) return '1m';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

/**
 * Formatea uptime como porcentaje
 * @param {number} uptime - Valor de uptime (0-100)
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Porcentaje formateado
 */
export function formatUptime(uptime, decimals = 0) {
  if (uptime === null || uptime === undefined) return '100%';
  return `${uptime.toFixed(decimals)}%`;
}

/**
 * Formatea bytes a formato legible
 * @param {number} bytes - Bytes
 * @returns {string} Tamaño formateado
 */
export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Formatea un número grande con sufijos K, M, B
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
export function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}
