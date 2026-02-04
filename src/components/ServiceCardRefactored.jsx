import { memo, useState, useCallback } from 'react';
import { Globe, Trash2, RefreshCw, BarChart3, FileText, MoreHorizontal, Lock, Unlock } from 'lucide-react';
import { Tooltip } from './ui';
import { HeartbeatBarCompact, UptimePercentages } from './HeartbeatBar';
import { SSLBadge } from './SSLInfo';
import ServiceTags from './ServiceTags';
import { useServiceLogs } from '../hooks/useServiceLogs';
import { getStatusConfig } from '../utils/statusConfig';
import { formatRelativeDate, formatResponseTime, formatInterval } from '../utils/formatters';

// ============================================
// Subcomponentes Memoizados
// ============================================

/**
 * Indicador de estado con animación
 */
const StatusIndicator = memo(function StatusIndicator({ status, isActive }) {
  const config = getStatusConfig(status);
  return (
    <div className={`w-3 h-3 rounded-full ${config.color} ${status === 'online' && isActive ? 'animate-pulse' : ''}`} />
  );
});

/**
 * Badge de estado con texto
 */
const StatusBadge = memo(function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  return (
    <span className={`text-xs font-semibold uppercase ${config.textColor}`}>
      {config.label}
    </span>
  );
});

/**
 * Badge de visibilidad (público/privado)
 */
const VisibilityBadge = memo(function VisibilityBadge({ isPublic, size = 'normal' }) {
  const sizeClasses = size === 'small' 
    ? 'px-1.5 py-0.5 text-[9px] gap-0.5' 
    : 'px-2 py-0.5 text-[10px] gap-1';
  const iconSize = size === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full flex-shrink-0 ${sizeClasses} ${
      isPublic 
        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    }`}>
      {isPublic ? <Unlock className={iconSize} /> : <Lock className={iconSize} />}
      {isPublic ? 'Público' : 'Privado'}
    </span>
  );
});

/**
 * Botón de acción rápida
 */
const ActionButton = memo(function ActionButton({ 
  onClick, 
  icon: IconComponent, 
  tooltip, 
  variant = 'default',
  disabled = false,
  loading = false,
  className = ''
}) {
  const variants = {
    default: 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    danger: 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
    success: 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    warning: 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
  };

  const button = (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
      ) : (
        <IconComponent className="w-4 h-4" />
      )}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip} position="top">{button}</Tooltip>;
  }
  return button;
});

/**
 * Grid de métricas compacto
 */
const MetricsGrid = memo(function MetricsGrid({ service, compact = false }) {
  const gridClass = compact ? 'grid-cols-3' : 'grid-cols-4';
  const padding = compact ? 'p-2' : 'p-2 rounded-lg bg-slate-50 dark:bg-gray-700/30';
  
  return (
    <div className={`grid ${gridClass} gap-2 ${compact ? 'pt-3 border-t border-slate-100 dark:border-gray-700' : ''}`}>
      <div className={`text-center ${padding}`}>
        <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase mb-1">Respuesta</div>
        <div className={`text-sm font-bold ${service.responseTime && service.responseTime > 1000 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
          {formatResponseTime(service.responseTime)}
        </div>
      </div>

      <div className={`text-center ${padding}`}>
        <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase mb-1">Uptime</div>
        <div className="text-sm font-bold text-slate-900 dark:text-white">
          {service.uptime?.toFixed(0) || 100}%
        </div>
      </div>

      <div className={`text-center ${padding}`}>
        <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase mb-1">{compact ? 'Check' : 'Intervalo'}</div>
        <div className="text-sm font-bold text-slate-900 dark:text-white">
          {formatInterval(service.checkInterval)}
        </div>
      </div>

      {!compact && (
        <div className={`text-center ${padding}`}>
          <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase mb-1">Check</div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {formatRelativeDate(service.lastChecked)}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Encabezado de la tarjeta de servicio
 */
const ServiceHeader = memo(function ServiceHeader({ service, status }) {
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;
  
  return (
    <div className="flex items-center gap-3">
      <div className={`relative w-10 h-10 rounded-xl ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}>
        <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
        {status === 'online' && service.isActive && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
        )}
      </div>
      
      <div>
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.label}
        </span>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          {config.description}
        </p>
      </div>
    </div>
  );
});

// ============================================
// Componentes de Tarjeta
// ============================================

/**
 * Tarjeta de servicio compacta
 */
const CompactServiceCard = memo(function CompactServiceCard({
  service,
  logs,
  isChecking,
  onCheck,
  onDelete,
  onTogglePublic
}) {
  
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
            <StatusIndicator status={service.status} isActive={service.isActive} />
            <StatusBadge status={service.status} />
          </div>
          <div className="flex items-center gap-1">
            <ActionButton
              onClick={() => onTogglePublic?.(service.id, !service.isPublic)}
              icon={service.isPublic ? Unlock : Lock}
              variant={service.isPublic ? 'success' : 'warning'}
              tooltip={service.isPublic ? 'Público - Click para hacer privado' : 'Privado - Click para hacer público'}
            />
            <ActionButton
              onClick={onCheck}
              icon={RefreshCw}
              loading={isChecking}
              disabled={!service.isActive}
            />
            <ActionButton
              onClick={() => onDelete(service.id, service.name)}
              icon={Trash2}
              variant="danger"
            />
          </div>
        </div>

        {/* Service Info */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
            {service.name}
          </h3>
          <VisibilityBadge isPublic={service.isPublic} size="small" />
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

        {/* Tags */}
        {service.tags?.length > 0 && (
          <div className="mt-2">
            <ServiceTags tags={service.tags} size="small" maxVisible={3} />
          </div>
        )}

        {/* HeartbeatBar */}
        <div className="mt-3">
          <HeartbeatBarCompact logs={logs} maxBars={20} />
        </div>

        {/* Metrics */}
        <div className="mt-3">
          <MetricsGrid service={service} compact={true} />
        </div>
      </div>
    </div>
  );
});

/**
 * Tarjeta de servicio normal (expandida)
 */
const NormalServiceCard = memo(function NormalServiceCard({
  service,
  logs,
  isChecking,
  onCheck,
  onDelete,
  onTogglePublic,
  onViewDetails,
  onViewStatistics,
  onViewHistory
}) {
  const config = getStatusConfig(service.status);
  
  return (
    <div 
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300 ease-out overflow-hidden ${
        service.isActive 
          ? 'border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-lg' 
          : 'border-slate-200 dark:border-gray-700 opacity-60 grayscale'
      }`}
    >
      {/* Status Indicator Bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${config.gradient} ${service.isActive ? 'opacity-100' : 'opacity-40'}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <ServiceHeader service={service} status={service.status} />

          <div className="flex items-center gap-1">
            {!service.isActive && (
              <span className="px-2 py-1 text-[10px] font-medium bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 rounded-full uppercase tracking-wide">
                Pausado
              </span>
            )}
            <Tooltip content={service.isPublic ? 'Público - Click para hacer privado' : 'Privado - Click para hacer público'} position="left">
              <button
                onClick={() => onTogglePublic?.(service.id, !service.isPublic)}
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
            <VisibilityBadge isPublic={service.isPublic} />
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
          
          {service.tags?.length > 0 && (
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

        {/* HeartbeatBar */}
        <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
              Historial de estado
            </span>
            <UptimePercentages logs={logs} periods={['24h', '7d', '30d']} />
          </div>
          <HeartbeatBarCompact logs={logs} maxBars={45} />
        </div>

        {/* Metrics */}
        <div className="mb-5">
          <MetricsGrid service={service} compact={false} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Tooltip content="Verificar estado del servicio ahora" position="top">
            <button
              onClick={onCheck}
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
              onClick={() => onViewStatistics?.(service)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98]"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Ver historial" position="top">
            <button
              onClick={() => onViewHistory?.(service)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98]"
            >
              <FileText className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Ver detalles" position="top">
            <button
              onClick={() => onViewDetails?.(service)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98]"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});

// ============================================
// Componente Principal
// ============================================

/**
 * ServiceCard - Tarjeta de servicio refactorizada
 * Usa subcomponentes memoizados para mejor rendimiento
 */
function ServiceCard({ 
  service, 
  onDelete, 
  onCheck, 
  onViewDetails, 
  onTogglePublic, 
  isCompact, 
  onViewStatistics, 
  onViewHistory 
}) {
  const [isChecking, setIsChecking] = useState(false);
  
  // Usar el hook para cargar logs
  const { logs } = useServiceLogs(service?.id, {
    limit: 50,
    refreshInterval: 30000,
    enabled: !!service?.id
  });

  // Memoizar el handler de check
  const handleCheck = useCallback(async () => {
    setIsChecking(true);
    await onCheck(service.id);
    setIsChecking(false);
  }, [onCheck, service.id]);

  if (isCompact) {
    return (
      <CompactServiceCard
        service={service}
        logs={logs}
        isChecking={isChecking}
        onCheck={handleCheck}
        onDelete={onDelete}
        onTogglePublic={onTogglePublic}
      />
    );
  }

  return (
    <NormalServiceCard
      service={service}
      logs={logs}
      isChecking={isChecking}
      onCheck={handleCheck}
      onDelete={onDelete}
      onTogglePublic={onTogglePublic}
      onViewDetails={onViewDetails}
      onViewStatistics={onViewStatistics}
      onViewHistory={onViewHistory}
    />
  );
}

export default memo(ServiceCard);

// Exportar subcomponentes para reutilización
export {
  StatusIndicator,
  StatusBadge,
  VisibilityBadge,
  ActionButton,
  MetricsGrid,
  ServiceHeader,
  CompactServiceCard,
  NormalServiceCard
};
