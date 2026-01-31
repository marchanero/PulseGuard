import ServiceCharts from './ServiceCharts';
import { useState } from 'react';

function ServiceListView({ services, onDelete, onCheck, isCompact }) {
  const [expandedService, setExpandedService] = useState(null);

  const getStatusConfig = (status) => {
    const configs = {
      online: {
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        label: 'Online'
      },
      offline: {
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-400',
        label: 'Offline'
      },
      degraded: {
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-700 dark:text-amber-400',
        label: 'Degradado'
      },
      timeout: {
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-700 dark:text-orange-400',
        label: 'Timeout'
      },
      default: {
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-600 dark:text-slate-400',
        label: 'Desconocido'
      }
    };
    return configs[status] || configs.default;
  };

  const formatResponseTime = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatUptime = (uptime) => {
    if (uptime === undefined || uptime === null) return '-';
    return `${uptime.toFixed(1)}%`;
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden ${isCompact ? 'text-sm' : ''}`}>
      {/* Header */}
      <div className={`grid grid-cols-12 gap-4 px-6 ${isCompact ? 'py-2' : 'py-3'} bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-700 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider`}>
        <div className="col-span-4">Servicio</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-2">Tiempo</div>
        <div className="col-span-2">Uptime</div>
        <div className="col-span-2 text-right">Acciones</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:divide-gray-700">
        {services.map((service) => {
          const status = getStatusConfig(service.status);
          const isExpanded = expandedService === service.id;

          return (
            <div key={service.id}>
              <div
                className={`grid grid-cols-12 gap-4 px-6 ${isCompact ? 'py-2' : 'py-4'} items-center hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer`}
                onClick={() => setExpandedService(isExpanded ? null : service.id)}
              >
                {/* Service Info */}
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-gray-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{service.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400 truncate max-w-[200px]">{service.url}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                    {status.label}
                  </span>
                </div>

                {/* Response Time */}
                <div className="col-span-2">
                  <span className="text-sm text-slate-600 dark:text-gray-300">
                    {formatResponseTime(service.responseTime)}
                  </span>
                </div>

                {/* Uptime */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(service.uptime || 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-gray-400 w-10">
                      {formatUptime(service.uptime)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheck(service.id);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Verificar ahora"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(service.id, service.name);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-gray-900/30 border-t border-slate-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Charts */}
                    <ServiceCharts service={service} />

                    {/* Info */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-2">Información</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-gray-400">URL:</span>
                            <a
                              href={service.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {service.url}
                            </a>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-gray-400">Intervalo:</span>
                            <span className="text-slate-900 dark:text-white">{service.checkInterval / 1000}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-gray-400">Última verificación:</span>
                            <span className="text-slate-900 dark:text-white">{formatDate(service.lastChecked)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-gray-400">Creado:</span>
                            <span className="text-slate-900 dark:text-white">{formatDate(service.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Logs */}
                      {service.logs && service.logs.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-2">Últimos logs</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {service.logs.slice(0, 5).map((log, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-2 py-1 rounded ${
                                  log.status === 'online'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : log.status === 'offline'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {formatDate(log.timestamp)} - {log.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ServiceListView;
