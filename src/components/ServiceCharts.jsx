import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// Tooltip personalizado para el gráfico de ping
const PingTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm text-slate-600 dark:text-gray-400">{data.time}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {data.responseTime}ms
        </p>
        <p className={`text-xs ${
          data.status === 'online' ? 'text-emerald-600' : 
          data.status === 'offline' ? 'text-red-600' : 'text-amber-600'
        }`}>
          {data.status}
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip personalizado para el gráfico de uptime
const UptimeTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {data.name}: {data.value}%
        </p>
      </div>
    );
  }
  return null;
};

function ServiceCharts({ logs, uptime }) {
  // Estado para controlar si el componente está montado y visible
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Pequeño delay para asegurar que el contenedor tenga dimensiones
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Preparar datos para el gráfico de ping (tiempos de respuesta)
  const pingData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    return logs
      .filter(log => log.responseTime !== null)
      .slice(0, 20) // Últimos 20 registros
      .reverse() // Orden cronológico
      .map((log, index) => ({
        index: index + 1,
        time: new Date(log.timestamp).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }),
        responseTime: log.responseTime,
        status: log.status
      }));
  }, [logs]);

  // Preparar datos para el diagrama de barras de uptime
  const uptimeData = useMemo(() => {
    const totalChecks = logs?.length || 0;
    if (totalChecks === 0) {
      return [
        { name: 'Online', value: uptime || 100, color: '#10b981' },
        { name: 'Offline', value: 0, color: '#ef4444' }
      ];
    }

    const onlineChecks = logs.filter(log => log.status === 'online').length;
    const offlineChecks = logs.filter(log => log.status === 'offline' || log.status === 'timeout').length;
    const otherChecks = totalChecks - onlineChecks - offlineChecks;

    return [
      { name: 'Online', value: Math.round((onlineChecks / totalChecks) * 100), color: '#10b981' },
      { name: 'Offline', value: Math.round((offlineChecks / totalChecks) * 100), color: '#ef4444' },
      { name: 'Otros', value: Math.round((otherChecks / totalChecks) * 100), color: '#f59e0b' }
    ].filter(item => item.value > 0);
  }, [logs, uptime]);

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-gray-700/30 rounded-lg p-6 text-center">
        <p className="text-slate-500 dark:text-gray-400 text-sm">
          No hay datos suficientes para mostrar gráficos
        </p>
      </div>
    );
  }

  // No renderizar charts hasta que el componente esté montado
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-slate-100 dark:bg-gray-700/30 rounded-lg animate-pulse" />
        <div className="h-40 bg-slate-100 dark:bg-gray-700/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Ping */}
      <div>
        <h5 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Tiempos de respuesta (últimas 20 verificaciones)
        </h5>
        <div className="h-48 bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700" style={{ minHeight: '192px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
            <LineChart data={pingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="index" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10 } }}
              />
              <Tooltip content={<PingTooltip />} />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diagrama de barras de Uptime */}
      <div>
        <h5 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Distribución de estado (basado en logs)
        </h5>
        <div className="h-40 bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700" style={{ minHeight: '160px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={80}>
            <BarChart data={uptimeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="category" 
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                width={60}
              />
              <Tooltip content={<UptimeTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {uptimeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default ServiceCharts;
