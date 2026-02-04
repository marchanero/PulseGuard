import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Clock, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';
import ServiceCharts from './ServiceCharts';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function StatisticsPage({ serviceId, onBack }) {
  const [service, setService] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7); // días

  useEffect(() => {
    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId, selectedPeriod]);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener datos del servicio
      const serviceResponse = await fetch(`${API_URL}/services/${serviceId}`, {
        credentials: 'include'
      });
      const serviceData = await serviceResponse.json();
      setService(serviceData);

      // Obtener logs del servicio
      const logsResponse = await fetch(`${API_URL}/services/${serviceId}/logs?days=${selectedPeriod}`, {
        credentials: 'include'
      });
      const logsData = await logsResponse.json();
      setLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching service data:', err);
      setError('Error al cargar los datos del servicio');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!logs || logs.length === 0) return null;

    const totalChecks = logs.length;
    const onlineChecks = logs.filter(log => log.status === 'online').length;
    const offlineChecks = logs.filter(log => log.status === 'offline').length;
    const timeoutChecks = logs.filter(log => log.status === 'timeout').length;
    
    const responseTimes = logs
      .filter(log => log.responseTime !== null)
      .map(log => log.responseTime);
    
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    const minResponseTime = responseTimes.length > 0 
      ? Math.min(...responseTimes)
      : 0;
    
    const maxResponseTime = responseTimes.length > 0 
      ? Math.max(...responseTimes)
      : 0;

    const uptimePercentage = service?.uptime || 0;
    const downtimePercentage = 100 - uptimePercentage;

    // Calcular incidentes (períodos consecutivos de offline)
    let incidents = 0;
    let currentIncident = false;
    logs.forEach(log => {
      if (log.status === 'offline' && !currentIncident) {
        incidents++;
        currentIncident = true;
      } else if (log.status === 'online') {
        currentIncident = false;
      }
    });

    return {
      totalChecks,
      onlineChecks,
      offlineChecks,
      timeoutChecks,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      uptimePercentage,
      downtimePercentage,
      incidents
    };
  };

  const stats = calculateStats();

  // Preparar datos para el gráfico de uptime por día
  const uptimeByDay = logs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString('es-ES');
    if (!acc[date]) {
      acc[date] = { online: 0, offline: 0, timeout: 0 };
    }
    if (log.status === 'online') acc[date].online++;
    else if (log.status === 'offline') acc[date].offline++;
    else if (log.status === 'timeout') acc[date].timeout++;
    return acc;
  }, {});

  const uptimeChartData = Object.entries(uptimeByDay).map(([date, data]) => ({
    date,
    online: data.online,
    offline: data.offline,
    timeout: data.timeout
  }));

  // Preparar datos para el gráfico de tiempos de respuesta
  const responseTimeData = logs
    .filter(log => log.responseTime !== null)
    .slice(0, 50)
    .reverse()
    .map((log, index) => ({
      index: index + 1,
      time: new Date(log.timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      responseTime: log.responseTime
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">{error}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Estadísticas de {service?.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {service?.url}
              </p>
            </div>
            <button
              onClick={fetchServiceData}
              className="p-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Período:</span>
            {[7, 30, 60, 90].map(days => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedPeriod === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
              >
                {days === 7 ? '7 días' : days === 30 ? '30 días' : days === 60 ? '60 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Total Checks</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalChecks}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Uptime</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.uptimePercentage.toFixed(1)}%
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Avg Response</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.avgResponseTime}ms
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Incidentes</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.incidents}
                </p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Detalles del Período
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Online</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {stats.onlineChecks}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Offline</p>
                  <p className="text-lg font-semibold text-red-600">
                    {stats.offlineChecks}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Timeout</p>
                  <p className="text-lg font-semibold text-amber-600">
                    {stats.timeoutChecks}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Min Response</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {stats.minResponseTime}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Max Response</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {stats.maxResponseTime}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Downtime</p>
                  <p className="text-lg font-semibold text-red-600">
                    {stats.downtimePercentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Check Interval</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {service?.checkInterval}s
                  </p>
                </div>
              </div>
            </div>

            {/* Response Time Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Tiempos de Respuesta
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseTimeData}>
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
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg">
                              <p className="text-sm text-slate-600 dark:text-gray-400">{data.time}</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {data.responseTime}ms
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
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

            {/* Uptime by Day Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Uptime por Día
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={uptimeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.date}</p>
                              <p className="text-xs text-emerald-600">Online: {data.online}</p>
                              <p className="text-xs text-red-600">Offline: {data.offline}</p>
                              <p className="text-xs text-amber-600">Timeout: {data.timeout}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="online" stackId="status" fill="#10b981" radius={[0, 0, 0, 4]} />
                    <Bar dataKey="offline" stackId="status" fill="#ef4444" radius={[0, 0, 0, 4]} />
                    <Bar dataKey="timeout" stackId="status" fill="#f59e0b" radius={[0, 0, 0, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Charts Component */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Gráficos Detallados
              </h2>
              <ServiceCharts logs={logs} uptime={stats.uptimePercentage} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default StatisticsPage;
