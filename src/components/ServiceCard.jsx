import { useState, useEffect } from 'react';
import { Activity, Clock, Globe, Trash2, RefreshCw, BarChart3, FileText, MoreHorizontal, Zap, Shield, AlertTriangle, Lock, Unlock, Wrench } from 'lucide-react';
import ServiceCharts from './ServiceCharts';
import { Tooltip } from './ui';
import { HeartbeatBarCompact, UptimePercentages } from './HeartbeatBar';
import { SSLBadge } from './SSLInfo';
import ServiceTags from './ServiceTags';

function ServiceCard({ service, onDelete, onCheck, onViewDetails, onTogglePublic, isCompact, onViewStatistics, onViewHistory }) {
  const [recentLogs, setRecentLogs] = useState([]);
  const [inMaintenance, setInMaintenance] = useState(false);

  // Cargar logs recientes para el HeartbeatBar
  useEffect(() => {
    const fetchRecentLogs = async () => {
      if (!service?.id) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/services/${service.id}/logs?limit=50`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setRecentLogs(data.logs || []);
        }
      } catch (error) {
        console.error('Error fetching logs for heartbeat:', error);
      }
    };

    fetchRecentLogs();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchRecentLogs, 30000);
    return () => clearInterval(interval);
  }, [service?.id, service?.status]);

  // Verificar si el servicio está en mantenimiento
  useEffect(() => {
    const checkMaintenance = async () => {
      if (!service?.id) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/maintenance/check/${service.id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setInMaintenance(data.inMaintenance || false);
        }
      } catch (error) {
        console.error('Error checking maintenance:', error);
      }
    };

    checkMaintenance();
    
    // Refrescar cada minuto
    const interval = setInterval(checkMaintenance, 60000);
    return () => clearInterval(interval);
  }, [service?.id]);
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
                onClick={() => onTogglePublic && onTogglePublic(service.id, !service.isPublic)}
                className={`p-1.5 rounded-lg transition-colors ${
                  service.isPublic 
                    ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                }`}
                title={service.isPublic ? 'Público - Click para hacer privado' : 'Privado - Click para hacer público'}
              >
                {service.isPublic ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {service.name}
            </h3>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium rounded-full flex-shrink-0 ${
              service.isPublic 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}>
              {service.isPublic ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
              {service.isPublic ? 'Público' : 'Privado'}
            </span>
            {/* Badge de Mantenimiento */}
            {inMaintenance && (
              <Tooltip content="En mantenimiento - Alertas pausadas">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium rounded-full flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <Wrench className="w-2.5 h-2.5" />
                  Mantenimiento
                </span>
              </Tooltip>
            )}
            {/* SSL Badge para URLs HTTPS */}
            {service.url?.startsWith('https://') && service.sslDaysRemaining !== undefined && (
              <SSLBadge sslDaysRemaining={service.sslDaysRemaining} />
            )}
          </div>
          <a 
            href={service.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors truncate block"
          >
            {service.url}
          </a>

          {/* Tags del servicio */}
          {service.tags && service.tags.length > 0 && (
            <div className="mt-2">
              <ServiceTags tags={service.tags} size="small" maxVisible={3} />
            </div>
          )}

          {/* HeartbeatBar Compacto */}
          <div className="mt-3">
            <HeartbeatBarCompact logs={recentLogs} maxBars={20} />
          </div>

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
            <Tooltip content={service.isPublic ? 'Público - Click para hacer privado' : 'Privado - Click para hacer público'} position="left">
              <button
                onClick={() => onTogglePublic && onTogglePublic(service.id, !service.isPublic)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  service.isPublic 
                    ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                }`}
              >
                {service.isPublic ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </Tooltip>
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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {service.name}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
              service.isPublic 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}>
              {service.isPublic ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {service.isPublic ? 'Público' : 'Privado'}
            </span>
            {/* Badge de Mantenimiento */}
            {inMaintenance && (
              <Tooltip content="En mantenimiento - Alertas pausadas">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <Wrench className="w-3 h-3" />
                  Mantenimiento
                </span>
              </Tooltip>
            )}
            {/* SSL Badge para URLs HTTPS */}
            {service.url?.startsWith('https://') && service.sslDaysRemaining !== undefined && (
              <SSLBadge sslDaysRemaining={service.sslDaysRemaining} />
            )}
          </div>
          <a 
            href={service.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate max-w-[220px] sm:max-w-[280px]">{service.url}</span>
          </a>
          
          {/* Tags del servicio */}
          {service.tags && service.tags.length > 0 && (
            <div className="mt-2">
              <ServiceTags tags={service.tags} size="small" maxVisible={5} />
            </div>
          )}
        </div>

        {service.description && (
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-5 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* HeartbeatBar - Inspirado en Uptime Kuma */}
        <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
              Historial de estado
            </span>
            <UptimePercentages logs={recentLogs} periods={['24h', '7d', '30d']} />
          </div>
          <HeartbeatBarCompact logs={recentLogs} maxBars={45} />
        </div>

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

          <Tooltip content="Ver estadísticas" position="top">
            <button
              onClick={() => onViewStatistics && onViewStatistics(service)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98]"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Ver historial" position="top">
            <button
              onClick={() => onViewHistory && onViewHistory(service)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98]"
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
    </div>
  );
}

export default ServiceCard;
