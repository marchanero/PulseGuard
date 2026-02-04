import { useState, useEffect } from 'react';
import { ArrowLeft, Globe, Clock, Activity, AlertTriangle, RefreshCw, Shield, Zap, Calendar, TrendingUp, BarChart3, Settings, ExternalLink } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function ServiceDetailsPage({ serviceId, onBack }) {
  const [service, setService] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, metrics, logs, settings

  useEffect(() => {
    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId]);

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
      const logsResponse = await fetch(`${API_URL}/services/${serviceId}/logs`, {
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

  const getStatusConfig = (status) => {
    const configs = {
      online: {
        color: 'bg-emerald-500',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        label: 'Online',
        icon: Shield,
        description: 'Operativo'
      },
      offline: {
        color: 'bg-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Offline',
        icon: AlertTriangle,
        description: 'No disponible'
      },
      degraded: {
        color: 'bg-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
        label: 'Degradado',
        icon: Zap,
        description: 'Rendimiento reducido'
      },
      timeout: {
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-700 dark:text-orange-400',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Timeout',
        icon: Clock,
        description: 'Tiempo excedido'
      },
      default: {
        color: 'bg-slate-400',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-600 dark:text-slate-400',
        borderColor: 'border-slate-200 dark:border-slate-700',
        label: 'Desconocido',
        icon: Activity,
        description: 'Sin datos'
      }
    };
    return configs[status] || configs.default;
  };

  const status = getStatusConfig(service?.status);
  const StatusIcon = status.icon;

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin datos';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
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

  const formatInterval = (seconds) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    if (seconds === 60) return '1m';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
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

    return {
      totalChecks,
      onlineChecks,
      offlineChecks,
      timeoutChecks,
      avgResponseTime,
      minResponseTime,
      maxResponseTime
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Cargando detalles...</p>
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
                Detalles de {service?.name}
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
        {/* Status Banner */}
        <div className={`mb-8 rounded-xl border-2 ${status.bgColor} ${status.borderColor} p-6`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl ${status.bgColor} flex items-center justify-center`}>
              <StatusIcon className={`w-8 h-8 ${status.textColor}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${status.textColor} mb-1`}>
                {status.label}
              </h2>
              <p className={`text-lg ${status.textColor}`}>
                {status.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 mb-8">
          <div className="flex border-b border-slate-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'metrics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Métricas
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Logs
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuración
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">Información Básica</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-gray-400">Nombre</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{service?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-gray-400">URL</span>
                        <a
                          href={service?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {service?.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-gray-400">Tipo</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{service?.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-gray-400">Estado</span>
                        <span className={`text-sm font-medium ${status.textColor}`}>{status.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-gray-400">Uptime</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{service?.uptime?.toFixed(1) || 100}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-gray-400">Intervalo</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formatInterval(service?.checkInterval)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {service?.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">Descripción</h3>
                      <p className="text-sm text-slate-600 dark:text-gray-400">
                        {service.description}
                      </p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">Fechas</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-gray-400">Creado</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(service?.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-gray-400">Último Check</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(service?.lastChecked)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && stats && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-gray-700/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-400 uppercase mb-1">Total Checks</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalChecks}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase mb-1">Online</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.onlineChecks}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-red-600 dark:text-red-400 uppercase mb-1">Offline</p>
                    <p className="text-2xl font-bold text-red-600">{stats.offlineChecks}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase mb-1">Timeout</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.timeoutChecks}</p>
                  </div>
                </div>

                {/* Response Time Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-gray-700/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-400 uppercase mb-1">Avg Response</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgResponseTime}ms</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-700/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-400 uppercase mb-1">Min Response</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.minResponseTime}ms</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-700/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-400 uppercase mb-1">Max Response</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.maxResponseTime}ms</p>
                  </div>
                </div>

                {/* Uptime Trend */}
                <div className="bg-slate-50 dark:bg-gray-700/30 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-gray-400">Uptime Actual</p>
                      <p className="text-3xl font-bold text-emerald-600">{service?.uptime?.toFixed(1) || 100}%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${service?.uptime || 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-gray-400">
                      No hay registros de logs disponibles
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {logs.slice(0, 50).map((log) => {
                      const logStatus = getStatusConfig(log.status);
                      const LogIcon = logStatus.icon;
                      
                      return (
                        <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-700/30 rounded-lg border border-slate-200 dark:border-gray-700">
                          <div className={`w-10 h-10 rounded-lg ${logStatus.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <LogIcon className={`w-5 h-5 ${logStatus.textColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-semibold ${logStatus.textColor}`}>
                                {logStatus.label}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-gray-400">
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {log.responseTime && (
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {formatResponseTime(log.responseTime)}
                                </span>
                              )}
                              {log.message && (
                                <span className="text-sm text-slate-600 dark:text-gray-400 truncate max-w-md">
                                  {log.message}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {logs.length > 50 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          Mostrando los últimos 50 registros de {logs.length} totales
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-gray-400">
                    Configuración del servicio no disponible aún
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
                    Esta funcionalidad estará disponible en futuras actualizaciones
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ServiceDetailsPage;
