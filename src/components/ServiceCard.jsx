import { useState } from 'react';
import ServiceCharts from './ServiceCharts';
import { Tooltip } from './ui';

function ServiceCard({ service, onDelete, onCheck, onViewDetails, isCompact }) {
  const [showLogs, setShowLogs] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      online: {
        color: 'bg-emerald-500',
        glowColor: 'shadow-emerald-500/50',
        bgColor: 'bg-emerald-50/80 dark:bg-emerald-900/30',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        label: 'Online',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ),
        description: 'Operativo'
      },
      offline: {
        color: 'bg-red-500',
        glowColor: 'shadow-red-500/50',
        bgColor: 'bg-red-50/80 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Offline',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        description: 'No disponible'
      },
      degraded: {
        color: 'bg-amber-500',
        glowColor: 'shadow-amber-500/50',
        bgColor: 'bg-amber-50/80 dark:bg-amber-900/30',
        textColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
        label: 'Degradado',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        description: 'Rendimiento reducido'
      },
      timeout: {
        color: 'bg-orange-500',
        glowColor: 'shadow-orange-500/50',
        bgColor: 'bg-orange-50/80 dark:bg-orange-900/30',
        textColor: 'text-orange-700 dark:text-orange-400',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Timeout',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: 'Tiempo excedido'
      },
      default: {
        color: 'bg-slate-400',
        glowColor: 'shadow-slate-400/50',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-600 dark:text-slate-400',
        borderColor: 'border-slate-200 dark:border-slate-700',
        label: 'Desconocido',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: 'Sin datos'
      }
    };
    return configs[status] || configs.default;
  };

  const status = getStatusConfig(service.status);

  const formatDate = (dateString) => {
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
  };

  const formatResponseTime = (ms) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatInterval = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds === 60) return '1m';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const handleCheck = async () => {
    setIsChecking(true);
    await onCheck(service.id);
    setIsChecking(false);
  };

  if (isCompact) {
    // Compact Mode Card
    return (
      <div 
        className={`group relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 ${
          service.isActive 
            ? 'border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md' 
            : 'border-slate-200 dark:border-gray-700 opacity-60 grayscale'
        }`}
      >
        <div className="p-4">
          {/* Top Row: Status + Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status.color} ${service.status === 'online' && service.isActive ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-semibold uppercase ${status.textColor}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCheck}
                disabled={isChecking || !service.isActive}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                {isChecking ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => onDelete(service.id, service.name)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Service Info */}
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1 truncate">
            {service.name}
          </h3>
          <a 
            href={service.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors truncate block"
          >
            {service.url}
          </a>

          {/* Compact Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-gray-700">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Respuesta</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {formatResponseTime(service.responseTime)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Uptime</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {service.uptime?.toFixed(0) || 100}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Check</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {formatInterval(service.checkInterval)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal Mode Card
  return (
    <div 
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-500 ease-out ${
        service.isActive 
          ? 'border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20' 
          : 'border-slate-200 dark:border-gray-700 opacity-60 grayscale'
      } ${isHovered ? 'scale-[1.02]' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect for online status */}
      {service.status === 'online' && service.isActive && (
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}></div>
      )}

      {/* Header Section */}
      <div className="p-6 pb-4">
        {/* Top Row: Status Badge + Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} ${status.borderColor} border transition-all duration-300 ${isHovered ? 'shadow-md' : ''}`}>
            <div className={`relative flex items-center justify-center w-5 h-5 rounded-full ${status.color} ${service.status === 'online' && service.isActive ? 'animate-pulse' : ''}`}>
              <div className="text-white">
                {status.icon}
              </div>
              {service.status === 'online' && (
                <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>
              )}
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-bold uppercase tracking-wider ${status.textColor}`}>
                {status.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-gray-400">
                {status.description}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {!service.isActive && (
              <span className="px-2 py-1 text-[10px] font-medium bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 rounded-full uppercase tracking-wide">
                Pausado
              </span>
            )}
            <Tooltip content="Eliminar servicio" position="left">
              <button
                onClick={() => onDelete(service.id, service.name)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Service Info */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
            {service.name}
          </h3>
          <a 
            href={service.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors group/link"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="truncate max-w-[200px] sm:max-w-[280px]">{service.url}</span>
            <svg className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {service.description && (
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="relative overflow-hidden bg-slate-50 dark:bg-gray-700/30 rounded-xl p-3 group/metric hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
            <div className="relative z-10">
              <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Respuesta</div>
              <div className={`text-lg font-bold ${service.responseTime && service.responseTime > 1000 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {formatResponseTime(service.responseTime)}
              </div>
            </div>
            <div className="absolute -right-2 -bottom-2 text-slate-100 dark:text-gray-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-50 dark:bg-gray-700/30 rounded-xl p-3 group/metric hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
            <div className="relative z-10">
              <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Uptime</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {service.uptime?.toFixed(1) || 100}%
              </div>
            </div>
            <div className="absolute -right-2 -bottom-2 text-slate-100 dark:text-gray-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-50 dark:bg-gray-700/30 rounded-xl p-3 group/metric hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
            <div className="relative z-10">
              <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Intervalo</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatInterval(service.checkInterval)}
              </div>
            </div>
            <div className="absolute -right-2 -bottom-2 text-slate-100 dark:text-gray-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-50 dark:bg-gray-700/30 rounded-xl p-3 group/metric hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
            <div className="relative z-10">
              <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Último check</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {formatDate(service.lastChecked)}
              </div>
            </div>
            <div className="absolute -right-2 -bottom-2 text-slate-100 dark:text-gray-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Tooltip content="Verificar estado del servicio ahora" position="top">
            <button
              onClick={handleCheck}
              disabled={isChecking || !service.isActive}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 dark:bg-white dark:hover:bg-gray-100 dark:disabled:bg-gray-800 text-white dark:text-slate-900 text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/20 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isChecking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-slate-400/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Verificar ahora</span>
                </>
              )}
            </button>
          </Tooltip>

          <Tooltip content={showCharts ? "Ocultar gráficos" : "Ver estadísticas y gráficos"} position="top">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`inline-flex items-center justify-center gap-2 text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                showCharts 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 ring-2 ring-purple-500/20' 
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">{showCharts ? 'Ocultar' : 'Estadísticas'}</span>
            </button>
          </Tooltip>

          <Tooltip content={showLogs ? "Ocultar historial" : "Ver historial de verificaciones"} position="top">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`inline-flex items-center justify-center gap-2 text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                showLogs 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20' 
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">{showLogs ? 'Ocultar' : 'Historial'}</span>
            </button>
          </Tooltip>

          <Tooltip content="Ver detalles completos del servicio" position="top">
            <button
              onClick={() => onViewDetails && onViewDetails(service)}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold py-3 px-4 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Detalles</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="border-t border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 p-6 animate-fade-in">
          <ServiceCharts logs={service.logs} uptime={service.uptime} />
        </div>
      )}

      {/* Logs Section */}
      {showLogs && service.logs && service.logs.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 p-6 animate-fade-in">
          <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historial de verificaciones
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {service.logs.map((log, index) => {
              const logStatus = getStatusConfig(log.status);
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-slate-100 dark:border-gray-700 hover:border-slate-200 dark:hover:border-gray-600 transition-colors">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${logStatus.bgColor} flex items-center justify-center`}>
                    <div className={logStatus.textColor}>
                      {logStatus.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold ${logStatus.textColor}`}>
                        {logStatus.label}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
                      {log.responseTime && (
                        <span className="font-medium">{formatResponseTime(log.responseTime)}</span>
                      )}
                      {log.message && (
                        <span className="truncate">{log.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceCard;
