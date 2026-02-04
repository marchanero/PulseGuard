import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Activity, AlertTriangle, RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function HistoryPage({ serviceId, onBack }) {
  const [service, setService] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, online, offline, timeout
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc
  const [expandedLogs, setExpandedLogs] = useState({});

  useEffect(() => {
    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId]);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Obtener datos del servicio
      const serviceResponse = await fetch(`${API_URL}/services/${serviceId}`, {
        headers
      });
      const serviceData = await serviceResponse.json();
      setService(serviceData);

      // Obtener logs del servicio
      const logsResponse = await fetch(`${API_URL}/services/${serviceId}/logs`, {
        headers
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

  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const getStatusConfig = (status) => {
    const configs = {
      online: {
        color: 'bg-emerald-500',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        label: 'Online',
        icon: '✓'
      },
      offline: {
        color: 'bg-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Offline',
        icon: '✗'
      },
      timeout: {
        color: 'bg-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
        label: 'Timeout',
        icon: '⏱'
      }
    };
    return configs[status] || configs.offline;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatResponseTime = (ms) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getFilteredLogs = () => {
    let filtered = logs;
    
    if (filter !== 'all') {
      filtered = logs.filter(log => log.status === filter);
    }
    
    if (sortOrder === 'desc') {
      filtered = [...filtered].reverse();
    }
    
    return filtered;
  };

  const filteredLogs = getFilteredLogs();

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

    return {
      totalChecks,
      onlineChecks,
      offlineChecks,
      timeoutChecks,
      avgResponseTime
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Cargando historial...</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Historial de {service?.name}
                </h1>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  {service?.url}
                </p>
              </div>
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
        {/* Stats Summary */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Resumen del Período
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-gray-400 uppercase mb-1">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalChecks}
                </p>
              </div>
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase mb-1">Online</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.onlineChecks}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 uppercase mb-1">Offline</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.offlineChecks}
                </p>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase mb-1">Timeout</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.timeoutChecks}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase mb-1">Avg Response</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.avgResponseTime}ms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Filtrar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('online')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === 'online'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => setFilter('offline')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === 'offline'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Offline
                </button>
                <button
                  onClick={() => setFilter('timeout')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === 'timeout'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Timeout
                </button>
              </div>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              <span>{sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}</span>
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-gray-400">
                No hay registros de historial disponibles
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-gray-700">
              {filteredLogs.map((log) => {
                const status = getStatusConfig(log.status);
                const isExpanded = expandedLogs[log.id];
                
                return (
                  <div key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* Summary Row */}
                    <div 
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      <div className={`w-10 h-10 rounded-full ${status.color} flex items-center justify-center text-white font-bold`}>
                        {status.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-semibold ${status.textColor}`}>
                              {status.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {formatDate(log.timestamp)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {log.responseTime && (
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {formatResponseTime(log.responseTime)}
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && log.message && (
                      <div className="px-4 pb-4 pl-14">
                        <div className="bg-slate-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <p className="text-sm text-slate-600 dark:text-gray-400">
                            <span className="font-medium">Mensaje:</span> {log.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default HistoryPage;
