import { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, Clock, TrendingUp, TrendingDown, Minus, Zap, Wifi, WifiOff } from 'lucide-react';

/**
 * PingChart - Gráfico de latencia en tiempo real
 * Inspirado en Uptime Kuma's ping chart
 */
export function PingChart({ 
  data = [], // Array de { timestamp, responseTime, status }
  height = 120,
  showAxis = true,
  showGrid = true,
  showTooltip = true,
  animated = true,
  color = 'emerald'
}) {
  const svgRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });

  // Colors based on theme
  const colors = {
    emerald: {
      line: '#10b981',
      fill: 'rgba(16, 185, 129, 0.1)',
      fillDark: 'rgba(16, 185, 129, 0.15)',
      point: '#059669'
    },
    blue: {
      line: '#3b82f6',
      fill: 'rgba(59, 130, 246, 0.1)',
      fillDark: 'rgba(59, 130, 246, 0.15)',
      point: '#2563eb'
    },
    amber: {
      line: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.1)',
      fillDark: 'rgba(245, 158, 11, 0.15)',
      point: '#d97706'
    },
    red: {
      line: '#ef4444',
      fill: 'rgba(239, 68, 68, 0.1)',
      fillDark: 'rgba(239, 68, 68, 0.15)',
      point: '#dc2626'
    }
  };

  const chartColor = colors[color] || colors.emerald;

  // Calculate chart dimensions and data
  const chartData = useMemo(() => {
    if (!data.length) return { points: [], path: '', areaPath: '' };

    const padding = { top: 10, right: 10, bottom: showAxis ? 25 : 10, left: showAxis ? 45 : 10 };
    const chartWidth = Math.max(dimensions.width - padding.left - padding.right, 100);
    const chartHeight = Math.max(height - padding.top - padding.bottom, 50);

    // Filter valid data points
    const validData = data.filter(d => d.responseTime !== null && d.status !== 'offline');
    
    if (!validData.length) return { points: [], path: '', areaPath: '', padding, chartWidth, chartHeight };

    // Calculate min/max
    const times = validData.map(d => d.responseTime);
    const minTime = Math.max(0, Math.min(...times) - 20);
    const maxTime = Math.max(...times) + 20;
    
    // Scale functions
    const xScale = (i) => padding.left + (i / (data.length - 1)) * chartWidth;
    const yScale = (value) => padding.top + chartHeight - ((value - minTime) / (maxTime - minTime)) * chartHeight;

    // Generate points
    const points = data.map((d, i) => ({
      x: xScale(i),
      y: d.responseTime !== null && d.status !== 'offline' ? yScale(d.responseTime) : null,
      data: d,
      index: i
    }));

    // Generate path (skip null points)
    let pathParts = [];
    let currentPath = [];
    
    points.forEach((p) => {
      if (p.y !== null) {
        currentPath.push(p);
      } else if (currentPath.length > 0) {
        pathParts.push(currentPath);
        currentPath = [];
      }
    });
    if (currentPath.length > 0) pathParts.push(currentPath);

    const paths = pathParts.map(part => {
      if (part.length === 0) return '';
      if (part.length === 1) return `M ${part[0].x} ${part[0].y}`;
      
      return part.map((p, i) => 
        i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
      ).join(' ');
    });

    // Generate area path (for fill)
    const areaPaths = pathParts.map(part => {
      if (part.length < 2) return '';
      
      const firstX = part[0].x;
      const lastX = part[part.length - 1].x;
      const baseY = padding.top + chartHeight;
      
      return `${part.map((p, i) => 
        i === 0 ? `M ${p.x} ${baseY} L ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
      ).join(' ')} L ${lastX} ${baseY} Z`;
    });

    return { 
      points, 
      path: paths.join(' '), 
      areaPath: areaPaths.join(' '),
      padding,
      chartWidth,
      chartHeight,
      minTime,
      maxTime
    };
  }, [data, dimensions.width, height, showAxis]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Generate Y axis labels
  const yAxisLabels = useMemo(() => {
    if (!showAxis || !chartData.maxTime) return [];
    
    const labels = [];
    const steps = 4;
    const range = chartData.maxTime - chartData.minTime;
    
    for (let i = 0; i <= steps; i++) {
      const value = chartData.minTime + (range * i / steps);
      const y = chartData.padding.top + chartData.chartHeight - (chartData.chartHeight * i / steps);
      labels.push({ value: Math.round(value), y });
    }
    
    return labels;
  }, [chartData, showAxis]);

  if (!data.length) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-50 dark:bg-gray-800 rounded-xl"
        style={{ height }}
      >
        <div className="text-center">
          <Activity className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 dark:text-gray-500">Sin datos de latencia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg 
        ref={svgRef} 
        className="w-full" 
        style={{ height }}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        {/* Grid lines */}
        {showGrid && chartData.chartWidth > 0 && (
          <g className="text-slate-200 dark:text-gray-700">
            {yAxisLabels.map((label, i) => (
              <line
                key={i}
                x1={chartData.padding?.left || 45}
                y1={label.y}
                x2={(chartData.padding?.left || 45) + (chartData.chartWidth || 0)}
                y2={label.y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.5"
              />
            ))}
          </g>
        )}

        {/* Y Axis labels */}
        {showAxis && (
          <g className="text-[10px] text-slate-400 dark:text-gray-500">
            {yAxisLabels.map((label, i) => (
              <text
                key={i}
                x={(chartData.padding?.left || 45) - 5}
                y={label.y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="currentColor"
              >
                {label.value}ms
              </text>
            ))}
          </g>
        )}

        {/* Area fill */}
        {chartData.areaPath && (
          <path
            d={chartData.areaPath}
            fill={`url(#gradient-${color})`}
            className={animated ? 'animate-fadeIn' : ''}
          />
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor.line} stopOpacity="0.3" />
            <stop offset="100%" stopColor={chartColor.line} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Line */}
        {chartData.path && (
          <path
            d={chartData.path}
            fill="none"
            stroke={chartColor.line}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animated ? 'animate-drawLine' : ''}
            style={animated ? { 
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: 'drawLine 1s ease-out forwards'
            } : {}}
          />
        )}

        {/* Points */}
        {chartData.points?.map((point, i) => (
          point.y !== null && (
            <g key={i}>
              {/* Hitbox for hover */}
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(point)}
                className="cursor-pointer"
              />
              {/* Visible point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint?.index === i ? 5 : 3}
                fill={point.data.status === 'online' ? chartColor.point : 
                      point.data.status === 'degraded' ? colors.amber.point : 
                      colors.red.point}
                className="transition-all duration-150"
              />
            </g>
          )
        ))}

        {/* Hover line */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={chartData.padding?.top || 10}
            x2={hoveredPoint.x}
            y2={(chartData.padding?.top || 10) + (chartData.chartHeight || 0)}
            stroke={chartColor.line}
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
        )}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredPoint && (
        <div 
          className="absolute z-10 px-2.5 py-1.5 bg-slate-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2"
          style={{ 
            left: hoveredPoint.x,
            top: (chartData.padding?.top || 10) - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold">{hoveredPoint.data.responseTime}ms</div>
          <div className="text-slate-400 dark:text-gray-400 text-[10px]">
            {new Date(hoveredPoint.data.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-drawLine {
          animation: drawLine 1s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * PingStats - Estadísticas de latencia
 */
export function PingStats({ data = [] }) {
  const stats = useMemo(() => {
    const validData = data.filter(d => d.responseTime !== null && d.status !== 'offline');
    
    if (!validData.length) return null;

    const times = validData.map(d => d.responseTime);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const latest = times[times.length - 1];
    
    // Calculate trend (comparing last 5 to previous 5)
    let trend = 'stable';
    if (times.length >= 10) {
      const recent = times.slice(-5);
      const previous = times.slice(-10, -5);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
      
      if (recentAvg > previousAvg * 1.2) trend = 'up';
      else if (recentAvg < previousAvg * 0.8) trend = 'down';
    }

    return { avg, min, max, latest, trend, count: validData.length };
  }, [data]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-4 text-slate-400 dark:text-gray-500 text-sm">
        Sin datos disponibles
      </div>
    );
  }

  const StatItem = ({ icon: Icon, label, value, unit = 'ms', color = 'slate' }) => (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {value}<span className="text-slate-400 dark:text-gray-500 font-normal">{unit}</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatItem 
        icon={Zap} 
        label="Actual" 
        value={stats.latest}
        color="emerald"
      />
      <StatItem 
        icon={Activity} 
        label="Promedio" 
        value={stats.avg}
        color="blue"
      />
      <StatItem 
        icon={TrendingDown} 
        label="Mínimo" 
        value={stats.min}
        color="emerald"
      />
      <StatItem 
        icon={TrendingUp} 
        label="Máximo" 
        value={stats.max}
        color="amber"
      />
    </div>
  );
}

/**
 * LatencyIndicator - Indicador de latencia con color
 */
export function LatencyIndicator({ responseTime, showLabel = true, size = 'normal' }) {
  const getLatencyColor = (ms) => {
    if (ms === null || ms === undefined) return 'slate';
    if (ms < 100) return 'emerald';
    if (ms < 300) return 'green';
    if (ms < 500) return 'amber';
    if (ms < 1000) return 'orange';
    return 'red';
  };

  const getLatencyText = (ms) => {
    if (ms === null || ms === undefined) return 'N/A';
    if (ms < 100) return 'Excelente';
    if (ms < 300) return 'Bueno';
    if (ms < 500) return 'Aceptable';
    if (ms < 1000) return 'Lento';
    return 'Muy lento';
  };

  const color = getLatencyColor(responseTime);
  
  const sizeClasses = {
    small: 'text-xs px-1.5 py-0.5 gap-1',
    normal: 'text-sm px-2 py-1 gap-1.5',
    large: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    normal: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  const colorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    slate: 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${sizeClasses[size]}
      ${colorClasses[color]}
    `}>
      {responseTime !== null ? (
        <Wifi className={iconSizes[size]} />
      ) : (
        <WifiOff className={iconSizes[size]} />
      )}
      <span className="font-mono">
        {responseTime !== null ? `${responseTime}ms` : '--'}
      </span>
      {showLabel && responseTime !== null && (
        <span className="opacity-75 text-[0.8em]">
          ({getLatencyText(responseTime)})
        </span>
      )}
    </span>
  );
}

/**
 * LivePingChart - Chart with simulated live updates
 */
export function LivePingChart({ 
  serviceId,
  initialData = [],
  maxPoints = 30,
  updateInterval = 5000 
}) {
  const [data, setData] = useState(initialData);

  // This would connect to real-time data source
  // For now it's just showing the component structure
  useEffect(() => {
    // In a real implementation, this would subscribe to WebSocket
    // or poll the API for latest data
    
    // Example simulation for demo purposes
    // const interval = setInterval(() => {
    //   setData(prev => {
    //     const newPoint = {
    //       timestamp: new Date().toISOString(),
    //       responseTime: Math.floor(Math.random() * 200) + 50,
    //       status: Math.random() > 0.1 ? 'online' : 'degraded'
    //     };
    //     return [...prev.slice(-maxPoints + 1), newPoint];
    //   });
    // }, updateInterval);
    
    // return () => clearInterval(interval);
  }, [serviceId, maxPoints, updateInterval]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Latencia en tiempo real
        </h4>
        {data.length > 0 && (
          <LatencyIndicator 
            responseTime={data[data.length - 1]?.responseTime} 
            showLabel={false}
            size="small"
          />
        )}
      </div>
      
      <PingChart 
        data={data} 
        height={150}
        showAxis={true}
        animated={true}
      />
      
      <PingStats data={data} />
    </div>
  );
}

export default PingChart;
