import { useState, useEffect, useMemo } from 'react';
import { Card, Button } from './ui';
import { Activity, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function PerformanceChart({ serviceId, isCompact = false }) {
  const [metrics, setMetrics] = useState([]);
  const [stats, setStats] = useState(null);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  const ranges = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' }
  ];

  useEffect(() => {
    fetchMetrics();
  }, [serviceId, range]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/services/${serviceId}/metrics?range=${range}`);
      const data = await response.json();
      setMetrics(data.metrics);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular puntos para el gráfico SVG
  const chartData = useMemo(() => {
    if (metrics.length === 0) return [];

    const maxResponseTime = Math.max(...metrics.map(m => m.responseTime || 0), 100);
    const minResponseTime = Math.min(...metrics.map(m => m.responseTime || 0), 0);
    const range = maxResponseTime - minResponseTime || 1;

    return metrics.map((m, index) => ({
      x: (index / (metrics.length - 1 || 1)) * 100,
      y: 100 - ((m.responseTime - minResponseTime) / range) * 100,
      status: m.status,
      responseTime: m.responseTime,
      timestamp: new Date(m.timestamp)
    }));
  }, [metrics]);

  // Generar path para el gráfico de línea
  const linePath = useMemo(() => {
    if (chartData.length === 0) return '';
    
    return chartData.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');
  }, [chartData]);

  // Generar área bajo la curva
  const areaPath = useMemo(() => {
    if (chartData.length === 0) return '';
    
    const line = chartData.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');
    
    return `${line} L 100 100 L 0 100 Z`;
  }, [chartData]);

  // eslint-disable-next-line no-unused-vars
  const _formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // eslint-disable-next-line no-unused-vars
  const _formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (loading) {
    return (
      <Card className={`${isCompact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-48 bg-slate-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card className={`${isCompact ? 'p-4' : 'p-6'}`}>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-gray-400">
            No hay datos de rendimiento disponibles
          </p>
          <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
            Los datos se recopilarán con cada verificación automática
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${isCompact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <TrendingUp className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`} />
          </div>
          <div>
            <h3 className={`font-semibold text-slate-900 dark:text-white ${isCompact ? 'text-sm' : 'text-base'}`}>
              Rendimiento Histórico
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {metrics.length} checks en {range}
            </p>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 rounded-lg p-1">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                range === r.value
                  ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">Media</span>
            </div>
            <p className={`font-semibold text-slate-900 dark:text-white ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {stats.avgResponseTime}ms
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs">Mín</span>
            </div>
            <p className={`font-semibold text-emerald-600 dark:text-emerald-400 ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {stats.minResponseTime}ms
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-xs">Máx</span>
            </div>
            <p className={`font-semibold text-amber-600 dark:text-amber-400 ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {stats.maxResponseTime}ms
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-xs">Uptime</span>
            </div>
            <p className={`font-semibold text-slate-900 dark:text-white ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {stats.uptime}%
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative">
        {/* SVG Chart */}
        <div className="relative h-48 w-full">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.2"
                className="text-slate-200 dark:text-gray-700"
              />
            ))}

            {/* Area under the curve */}
            <path
              d={areaPath}
              fill="currentColor"
              className="text-blue-500/10 dark:text-blue-400/10"
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500 dark:text-blue-400"
            />

            {/* Data points */}
            {chartData.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="0.8"
                fill="currentColor"
                className={
                  point.status === 'online' ? 'text-emerald-500' :
                  point.status === 'offline' ? 'text-red-500' :
                  'text-amber-500'
                }
              />
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 dark:text-gray-500 -ml-6">
            <span>{stats?.maxResponseTime || 100}ms</span>
            <span>{Math.round((stats?.maxResponseTime || 100) / 2)}ms</span>
            <span>0ms</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-gray-500 mt-2 pt-2 border-t border-slate-100 dark:border-gray-800">
          {range === '1h' ? (
            <>
              <span>Ahora</span>
              <span>-30m</span>
              <span>-1h</span>
            </>
          ) : range === '24h' ? (
            <>
              <span>Ahora</span>
              <span>-12h</span>
              <span>-24h</span>
            </>
          ) : range === '7d' ? (
            <>
              <span>Ahora</span>
              <span>-3.5d</span>
              <span>-7d</span>
            </>
          ) : (
            <>
              <span>Ahora</span>
              <span>-15d</span>
              <span>-30d</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs text-slate-500 dark:text-gray-400">Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span className="text-xs text-slate-500 dark:text-gray-400">Lento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-xs text-slate-500 dark:text-gray-400">Offline</span>
        </div>
      </div>
    </Card>
  );
}

export default PerformanceChart;
