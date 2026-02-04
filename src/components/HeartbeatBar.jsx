import { useState, useMemo, useEffect, useRef } from 'react';

/**
 * HeartbeatBar - Componente inspirado en Uptime Kuma
 * Muestra una barra visual con el historial de estados del servicio
 * Con animaciones en tiempo real
 */
function HeartbeatBar({ 
  logs = [], 
  size = 'normal', // 'small', 'normal', 'large'
  maxBars = 50,
  showTooltip = true 
}) {
  const [hoveredBeat, setHoveredBeat] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const prevLogsCountRef = useRef(logs.length);
  
  // Detectar cuando llegan nuevos logs
  useEffect(() => {
    if (logs.length > prevLogsCountRef.current) {
      // Usar requestAnimationFrame para evitar el warning de setState en effect
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      const timer = setTimeout(() => setIsAnimating(false), 600);
      prevLogsCountRef.current = logs.length;
      return () => clearTimeout(timer);
    }
    prevLogsCountRef.current = logs.length;
  }, [logs.length]);

  // Usar useMemo para derivar beats de logs
  const beats = useMemo(() => {
    if (logs && logs.length > 0) {
      return logs.slice(0, maxBars).map((log, index) => ({
        id: log.id || `beat-${index}-${log.timestamp}`,
        status: log.status,
        responseTime: log.responseTime,
        timestamp: log.timestamp,
        message: log.message,
        isNew: index === 0 // El más reciente
      })).reverse(); // Mostrar más antiguos a la izquierda
    } else {
      // Si no hay logs, mostrar barras vacías
      return Array(maxBars).fill(null).map((_, i) => ({ status: 'empty', id: `empty-${i}` }));
    }
  }, [logs, maxBars]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500 hover:bg-emerald-400';
      case 'offline':
        return 'bg-red-500 hover:bg-red-400';
      case 'degraded':
        return 'bg-amber-500 hover:bg-amber-400';
      case 'timeout':
        return 'bg-orange-500 hover:bg-orange-400';
      case 'maintenance':
        return 'bg-purple-500 hover:bg-purple-400';
      case 'empty':
      default:
        return 'bg-slate-300 dark:bg-gray-600';
    }
  };

  const getStatusGlow = (status) => {
    switch (status) {
      case 'online':
        return 'shadow-emerald-500/50';
      case 'offline':
        return 'shadow-red-500/50';
      case 'degraded':
        return 'shadow-amber-500/50';
      case 'timeout':
        return 'shadow-orange-500/50';
      default:
        return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'degraded': return 'Degradado';
      case 'timeout': return 'Timeout';
      case 'maintenance': return 'Mantenimiento';
      default: return 'Sin datos';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { bar: 'h-4', beat: 'w-1', gap: 'gap-[2px]' };
      case 'large':
        return { bar: 'h-10', beat: 'w-2.5', gap: 'gap-1' };
      case 'normal':
      default:
        return { bar: 'h-6', beat: 'w-1.5', gap: 'gap-[3px]' };
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMouseEnter = (e, beat) => {
    if (!showTooltip || beat.status === 'empty') return;
    const rect = e.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredBeat(beat);
  };

  const handleMouseLeave = () => {
    setHoveredBeat(null);
  };

  const sizeClasses = getSizeClasses();

  // Detectar el último beat (más reciente, que está al final después del reverse)
  const lastBeatIndex = beats.length - 1;

  return (
    <div className="relative">
      {/* Barra de heartbeats */}
      <div className={`flex items-center ${sizeClasses.gap} ${sizeClasses.bar}`}>
        {beats.map((beat, index) => {
          const isLastBeat = index === lastBeatIndex && beat.status !== 'empty';
          const shouldAnimate = isLastBeat && isAnimating;
          
          return (
            <div
              key={beat.id || index}
              className={`
                ${sizeClasses.beat} h-full rounded-sm cursor-pointer
                transition-all duration-300 ease-out
                ${getStatusColor(beat.status)}
                ${beat.status !== 'empty' ? 'hover:scale-110 hover:shadow-md' : ''}
                ${shouldAnimate ? `animate-heartbeat-bounce shadow-lg ${getStatusGlow(beat.status)}` : ''}
                ${isLastBeat && beat.status !== 'empty' ? 'ring-1 ring-white/30' : ''}
              `}
              style={{
                animationDelay: `${index * 10}ms`,
              }}
              onMouseEnter={(e) => handleMouseEnter(e, beat)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredBeat && showTooltip && (
        <div
          className="fixed z-50 px-3 py-2 text-xs bg-slate-900 dark:bg-gray-700 text-white rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(hoveredBeat.status).split(' ')[0]}`} />
            <span className="font-semibold">{getStatusLabel(hoveredBeat.status)}</span>
          </div>
          {hoveredBeat.responseTime && (
            <div className="text-slate-300">
              Respuesta: {hoveredBeat.responseTime}ms
            </div>
          )}
          {hoveredBeat.timestamp && (
            <div className="text-slate-400">
              {formatTime(hoveredBeat.timestamp)}
            </div>
          )}
          {hoveredBeat.message && (
            <div className="text-slate-400 mt-1 max-w-48 truncate">
              {hoveredBeat.message}
            </div>
          )}
          {/* Flecha del tooltip */}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
            <div className="border-4 border-transparent border-t-slate-900 dark:border-t-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HeartbeatBarCompact - Versión compacta para tarjetas con animación
 */
export function HeartbeatBarCompact({ logs = [], maxBars = 30 }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevLogsCountRef = useRef(logs.length);
  
  const processedLogs = useMemo(() => logs.slice(0, maxBars).reverse(), [logs, maxBars]);
  
  // Detectar cuando llegan nuevos logs
  useEffect(() => {
    if (logs.length > prevLogsCountRef.current) {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      const timer = setTimeout(() => setIsAnimating(false), 800);
      prevLogsCountRef.current = logs.length;
      return () => clearTimeout(timer);
    }
    prevLogsCountRef.current = logs.length;
  }, [logs.length]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'degraded': return 'bg-amber-500';
      case 'timeout': return 'bg-orange-500';
      default: return 'bg-slate-300 dark:bg-gray-600';
    }
  };

  const getStatusGlow = (status) => {
    switch (status) {
      case 'online': return 'shadow-emerald-400';
      case 'offline': return 'shadow-red-400';
      case 'degraded': return 'shadow-amber-400';
      case 'timeout': return 'shadow-orange-400';
      default: return '';
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center gap-[2px] h-3">
        {Array(maxBars).fill(null).map((_, i) => (
          <div key={i} className="w-1 h-full rounded-sm bg-slate-200 dark:bg-gray-700 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    );
  }

  const emptyBarsCount = Math.max(0, maxBars - processedLogs.length);
  const lastIndex = processedLogs.length - 1;

  return (
    <div className="flex items-center gap-[2px] h-3">
      {/* Rellenar con barras vacías si no hay suficientes logs */}
      {Array(emptyBarsCount).fill(null).map((_, i) => (
        <div key={`empty-${i}`} className="w-1 h-full rounded-sm bg-slate-200 dark:bg-gray-700" />
      ))}
      {processedLogs.map((log, index) => {
        const isLast = index === lastIndex;
        const shouldAnimate = isLast && isAnimating;
        
        return (
          <div
            key={log.id || `log-${index}-${log.timestamp}`}
            className={`
              w-1 h-full rounded-sm transition-all duration-300
              ${getStatusColor(log.status)}
              ${shouldAnimate ? `animate-heartbeat-bounce shadow-md ${getStatusGlow(log.status)}` : ''}
              ${isLast && log.status !== 'empty' ? 'scale-y-110' : ''}
            `}
            title={`${log.status} - ${log.responseTime ? log.responseTime + 'ms' : ''}`}
          />
        );
      })}
    </div>
  );
}

/**
 * UptimePercentages - Muestra uptime de diferentes períodos
 */
export function UptimePercentages({ logs = [], periods = ['24h', '7d', '30d'] }) {
  const calculateUptime = (periodHours) => {
    if (!logs || logs.length === 0) return null;
    
    const now = new Date();
    const periodStart = new Date(now.getTime() - (periodHours * 60 * 60 * 1000));
    
    const periodLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= periodStart;
    });
    
    if (periodLogs.length === 0) return null;
    
    const onlineLogs = periodLogs.filter(log => log.status === 'online').length;
    return ((onlineLogs / periodLogs.length) * 100).toFixed(2);
  };

  const periodHoursMap = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
    '90d': 24 * 90,
    '1y': 24 * 365
  };

  const getUptimeColor = (uptime) => {
    if (uptime === null) return 'text-slate-400';
    const value = parseFloat(uptime);
    if (value >= 99.9) return 'text-emerald-500';
    if (value >= 99) return 'text-emerald-600';
    if (value >= 95) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center gap-4">
      {periods.map(period => {
        const hours = periodHoursMap[period];
        const uptime = calculateUptime(hours);
        
        return (
          <div key={period} className="text-center">
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-0.5">
              {period}
            </p>
            <p className={`text-sm font-bold ${getUptimeColor(uptime)}`}>
              {uptime !== null ? `${uptime}%` : '—'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default HeartbeatBar;
