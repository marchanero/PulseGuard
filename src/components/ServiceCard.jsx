import { useState } from 'react';
import { Activity, Clock, Globe, Trash2, RefreshCw, BarChart3, FileText, MoreHorizontal, Zap, Shield, AlertTriangle } from 'lucide-react';
import ServiceCharts from './ServiceCharts';
import { Tooltip } from './ui';

function ServiceCard({ service, onDelete, onCheck, onViewDetails, isCompact }) {
  const [showLogs, setShowLogs] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
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
      default: {
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
    return configs[status] || configs.default;
  };

  const status = getStatusConfig(service.status);
  const StatusIcon = status.icon;

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
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onDelete(service.id, service.name)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
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

  // Normal Mode Card - Modern Design
  return (
    <div 
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300 ease-out overflow-hidden ${
        service.isActive 
          ? 'border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-lg' 
          : 'border-slate-200 dark:border-gray-700 opacity-60 grayscale'
      }`}
    >
      {/* Status Indicator Bar at Top */}
      <div className={`h-1 w-full bg-gradient-to-r ${status.gradient} ${service.isActive ? 'opacity-100' : 'opacity-40'}`} />
      
      {/* Header Section */}
      <div className="p-5">
        {/* Top Row: Status Badge + Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Status Icon Circle */}
            <div className={`relative w-10 h-10 rounded-xl ${status.bgColor} ${status.borderColor} border flex items-center justify-center`}>
              <StatusIcon className={`w-5 h-5 ${status.textColor}`} />
              {service.status === 'online' && service.isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
              )}
            </div>
            
            {/* Status Text */}
            <div>
              <span className={`text-sm font-semibold ${status.textColor}`}>
                {status.label}
              </span>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {status.description}
              </p>
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
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Service Info */}
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {service.name}
          </h3>
          <a 
            href={service.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate max-w-[220px] sm:max-w-[280px]">{service.url}</span>
          </a>
        </div>

        {service.description && (
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-5 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Modern Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-gray-700/30">
            <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase mb-1">Respuesta</div>
            <div className={`text-sm font-bold ${service.responseTime && service.responseTime > 1000 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {formatResponseTime(service.responseTime)}
            </div>
          </div>

          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-gray-700/30">
            <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase mb-1">Uptime</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {service.uptime?.toFixed(0) || 100}%
            </div>
          </div>

          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-gray-700/30">
            <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase mb-1">Intervalo</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {formatInterval(service.checkInterval)}
            </div>
          </div>

          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-gray-700/30">
            <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase mb-1">Check</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {formatDate(service.lastChecked)}
            </div>
          </div>
        </div>

        {/* Modern Action Buttons */}
        <div className="flex gap-2">
          <Tooltip content="Verificar estado del servicio ahora" position="top">
            <button
              onClick={handleCheck}
              disabled={isChecking || !service.isActive}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 dark:bg-white dark:hover:bg-gray-100 dark:disabled:bg-gray-800 text-white dark:text-slate-900 text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isChecking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-slate-400/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Verificar</span>
                </>
              )}
            </button>
          </Tooltip>

          <Tooltip content={showCharts ? "Ocultar gráficos" : "Ver estadísticas"} position="top">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`inline-flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                showCharts 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content={showLogs ? "Ocultar historial" : "Ver historial"} position="top">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`inline-flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                showLogs 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              <FileText className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Ver detalles" position="top">
            <button
              onClick={() => onViewDetails && onViewDetails(service)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98]"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="border-t border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 p-5 animate-fade-in">
          <ServiceCharts logs={service.logs} uptime={service.uptime} />
        </div>
      )}

      {/* Logs Section */}
      {showLogs && service.logs && service.logs.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 p-5 animate-fade-in">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Historial de verificaciones
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {service.logs.slice(0, 5).map((log, index) => {
              const logStatus = getStatusConfig(log.status);
              const LogIcon = logStatus.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-700/50 rounded-lg border border-slate-100 dark:border-gray-700">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg ${logStatus.bgColor} flex items-center justify-center`}>
                    <LogIcon className={`w-3.5 h-3.5 ${logStatus.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${logStatus.textColor}`}>
                        {logStatus.label}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-gray-400">
                      {log.responseTime && (
                        <span>{formatResponseTime(log.responseTime)}</span>
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
