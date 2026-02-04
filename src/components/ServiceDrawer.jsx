import { useEffect, useState } from 'react';
import ServiceCharts from './ServiceCharts';
import PerformanceChart from './PerformanceChart';
import HeartbeatBar, { UptimePercentages } from './HeartbeatBar';
import SSLInfo from './SSLInfo';

function ServiceDrawer({ service, isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Cargar logs para el HeartbeatBar
  useEffect(() => {
    const fetchLogs = async () => {
      if (!service?.id || !isOpen) return;
      setLoadingLogs(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/services/${service.id}/logs?limit=100`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoadingLogs(false);
      }
    };

    if (isOpen) {
      fetchLogs();
    }
  }, [service?.id, isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  const getStatusConfig = (status) => {
    const configs = {
      online: {
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        label: 'Online',
        icon: '✓'
      },
      offline: {
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Offline',
        icon: '✕'
      },
      degraded: {
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
        label: 'Degradado',
        icon: '⚠'
      },
      timeout: {
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-700 dark:text-orange-400',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Timeout',
        icon: '⏱'
      },
      default: {
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-600 dark:text-slate-400',
        borderColor: 'border-slate-200 dark:border-slate-700',
        label: 'Desconocido',
        icon: '?'
      }
    };
    return configs[status] || configs.default;
  };

  const status = getStatusConfig(service.status);

  const formatResponseTime = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatUptime = (uptime) => {
    if (uptime === undefined || uptime === null) return '-';
    return `${uptime.toFixed(2)}%`;
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getIntervalLabel = (ms) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full">
        <div className="h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                <span className="text-lg font-bold">{status.icon}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{service.name}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                  {status.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Tiempo de respuesta</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatResponseTime(service.responseTime)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Uptime</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatUptime(service.uptime)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Intervalo</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {getIntervalLabel(service.checkInterval)}
                </p>
              </div>
            </div>

            {/* HeartbeatBar - Historial visual de estado */}
            <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Historial de Estado
                </h3>
                <UptimePercentages logs={logs} periods={['24h', '7d', '30d']} />
              </div>
              {loadingLogs ? (
                <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <HeartbeatBar 
                  logs={logs} 
                  size="large" 
                  maxBars={60}
                  showTooltip={true}
                />
              )}
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-2 text-center">
                Últimas {logs.length} verificaciones • Pasa el cursor para ver detalles
              </p>
            </div>

            {/* Performance Chart */}
            <PerformanceChart serviceId={service.id} />

            {/* SSL Certificate Info */}
            {service.url?.startsWith('https://') && (service.sslExpiryDate || service.sslDaysRemaining !== undefined) && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Certificado SSL</h3>
                <SSLInfo 
                  sslExpiryDate={service.sslExpiryDate} 
                  sslDaysRemaining={service.sslDaysRemaining}
                  variant="full"
                />
              </div>
            )}

            {/* Charts */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Distribución de Estado</h3>
              <ServiceCharts logs={logs.length > 0 ? logs : service.logs} uptime={service.uptime} />
            </div>

            {/* Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Detalles</h3>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-gray-400">URL</span>
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {service.url}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-gray-400">Estado HTTP</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {service.statusCode || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-gray-400">Última verificación</span>
                  <span className="text-slate-900 dark:text-white">{formatDate(service.lastChecked)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-gray-400">Creado</span>
                  <span className="text-slate-900 dark:text-white">{formatDate(service.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-gray-400">Actualizado</span>
                  <span className="text-slate-900 dark:text-white">{formatDate(service.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Logs */}
            {logs && logs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                  Historial de Logs ({logs.length})
                </h3>
                <div className="bg-slate-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`px-4 py-3 border-b border-slate-200 dark:border-gray-700 last:border-0 ${
                          log.status === 'online'
                            ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                            : log.status === 'offline'
                            ? 'bg-red-50/50 dark:bg-red-900/10'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm text-slate-900 dark:text-white">{log.message}</p>
                            {log.responseTime && (
                              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                                Tiempo: {formatResponseTime(log.responseTime)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceDrawer;
