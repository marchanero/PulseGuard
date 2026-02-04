import { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Globe,
  Server,
  Wifi,
  Shield,
  RefreshCw,
  ExternalLink,
  BarChart3,
  FileText,
  X
} from 'lucide-react';
import ServiceCharts from './ServiceCharts';
import PerformanceChart from './PerformanceChart';
import { HeartbeatBarCompact, UptimePercentages } from './HeartbeatBar';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const statusConfig = {
  operational: {
    label: 'Todos los sistemas operativos',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle2
  },
  degraded: {
    label: 'Rendimiento degradado',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: AlertTriangle
  },
  partial_outage: {
    label: 'Interrupción parcial',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: AlertTriangle
  },
  major_outage: {
    label: 'Interrupción mayor',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: XCircle
  },
  unknown: {
    label: 'Estado desconocido',
    color: 'text-slate-600 dark:text-gray-400',
    bgColor: 'bg-slate-50 dark:bg-gray-800',
    borderColor: 'border-slate-200 dark:border-gray-700',
    icon: Activity
  }
};

const serviceTypeIcons = {
  HTTP: Globe,
  HTTPS: Shield,
  PING: Wifi,
  DNS: Globe,
  TCP: Server,
  SSL: Shield
};

function ServiceStatus({ service, onClick, logs = [] }) {
  const TypeIcon = serviceTypeIcons[service.type] || Globe;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'degraded': return 'bg-yellow-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Operativo';
      case 'offline': return 'Caído';
      case 'degraded': return 'Degradado';
      default: return 'Desconocido';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-gray-700">
            <TypeIcon className="w-5 h-5 text-slate-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {service.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {service.type} • {service.responseTime ? `${service.responseTime}ms` : '—'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(service.status)} animate-pulse`} />
          <span className={`text-sm font-medium ${
            service.status === 'online' ? 'text-green-600 dark:text-green-400' :
            service.status === 'offline' ? 'text-red-600 dark:text-red-400' :
            service.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-slate-500 dark:text-gray-400'
          }`}>
            {getStatusText(service.status)}
          </span>
        </div>
      </div>
      
      {/* HeartbeatBar */}
      <div className="mt-3">
        <HeartbeatBarCompact logs={logs} maxBars={45} />
      </div>
      
      {/* Uptime info */}
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-gray-400">
        <span>{service.uptime?.toFixed(2) || '100.00'}% uptime</span>
        <span className="text-slate-400">Haz clic para ver detalles</span>
      </div>
    </div>
  );
}

function UptimeBar({ percentage }) {
  const getColor = (pct) => {
    if (pct >= 99) return 'bg-green-500';
    if (pct >= 95) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={`h-full ${getColor(percentage)} transition-all duration-500`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

export function StatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('details');
  const [serviceLogs, setServiceLogs] = useState({});

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setDrawerTab('details');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedService(null);
  };

  // Cargar logs de todos los servicios para los HeartbeatBars
  const fetchServiceLogs = async (services) => {
    const logsMap = {};
    await Promise.all(
      services.map(async (service) => {
        try {
          const response = await fetch(`${API_URL}/services/${service.id}/logs?limit=50`);
          if (response.ok) {
            const data = await response.json();
            logsMap[service.id] = data.logs || [];
          }
        } catch (error) {
          console.error(`Error fetching logs for service ${service.id}:`, error);
          logsMap[service.id] = [];
        }
      })
    );
    setServiceLogs(logsMap);
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      if (!response.ok) throw new Error('Error al cargar el estado');
      const statusData = await response.json();
      setData(statusData);
      setLastUpdated(new Date());
      setError(null);
      
      // Cargar logs para HeartbeatBars
      if (statusData?.services?.length > 0) {
        fetchServiceLogs(statusData.services);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Cargando estado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Error al cargar el estado
          </h2>
          <p className="text-slate-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const config = statusConfig[data?.status] || statusConfig.unknown;
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  PulseGuard Status
                </h1>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Estado de los servicios en tiempo real
                </p>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Admin
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado general */}
        <div className={`mb-8 p-6 rounded-2xl border-2 ${config.bgColor} ${config.borderColor}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm`}>
              <StatusIcon className={`w-8 h-8 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${config.color}`}>
                {config.label}
              </h2>
              <p className="text-slate-600 dark:text-gray-400 mt-1">
                {data?.summary?.online} de {data?.summary?.total} servicios operativos
                {lastUpdated && (
                  <span className="ml-2 text-sm">
                    • Actualizado <TimeAgo date={lastUpdated} />
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Operativos"
            value={data?.summary?.online || 0}
            color="green"
            icon={CheckCircle2}
          />
          <StatCard
            label="Caídos"
            value={data?.summary?.offline || 0}
            color="red"
            icon={XCircle}
          />
          <StatCard
            label="Degradados"
            value={data?.summary?.degraded || 0}
            color="yellow"
            icon={AlertTriangle}
          />
          <StatCard
            label="Uptime medio"
            value={`${(data?.summary?.averageUptime || 0).toFixed(2)}%`}
            color="blue"
            icon={Clock}
          />
        </div>

        {/* Lista de servicios */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Servicios monitoreados
          </h3>
          
          {data?.services?.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
              <Activity className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-gray-400">
                No hay servicios configurados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.services?.map((service) => (
                <ServiceStatus 
                  key={service.id} 
                  service={service} 
                  onClick={() => handleServiceClick(service)}
                  logs={serviceLogs[service.id] || []}
                />
              ))}
            </div>
          )}
        </div>

        {/* Uptime general */}
        {data?.summary?.averageUptime && (
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Uptime general
              </h3>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {data.summary.averageUptime.toFixed(2)}%
              </span>
            </div>
            <UptimeBar percentage={data.summary.averageUptime} />
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
              Promedio de disponibilidad de todos los servicios
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-gray-700 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-gray-400">
            <p>
              Powered by PulseGuard
            </p>
            <p>
              Última actualización: {lastUpdated?.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </footer>

      {/* Status Drawer */}
      <StatusDrawer 
        service={selectedService}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        activeTab={drawerTab}
        setActiveTab={setDrawerTab}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function TimeAgo({ date }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor((new Date() - date) / 1000);
      
      if (seconds < 60) {
        setText('hace unos segundos');
      } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        setText(`hace ${mins} min`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setText(`hace ${hours} h`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [date]);

  return <span>{text}</span>;
}

function StatusDrawer({ service, isOpen, onClose, activeTab, setActiveTab }) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  const getStatusConfig = (status) => {
    const configs = {
      online: {
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        label: 'Operativo',
        icon: '✓'
      },
      offline: {
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Caído',
        icon: '✕'
      },
      degraded: {
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
        label: 'Degradado',
        icon: '⚠'
      },
      timeout: {
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-700 dark:text-orange-400',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Timeout',
        icon: '⏱'
      },
      default: {
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-600 dark:text-slate-400',
        borderColor: 'border-slate-200 dark:border-slate-700',
        label: 'Desconocido',
        icon: '?'
      }
    };
    return configs[status] || configs.default;
  };

  const status = getStatusConfig(service.status);

  const formatResponseTime = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatUptime = (uptime) => {
    if (uptime === undefined || uptime === null) return '-';
    return `${uptime.toFixed(2)}%`;
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getIntervalLabel = (ms) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const tabs = [
    { id: 'details', label: 'Detalles', icon: Activity },
    { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
    { id: 'history', label: 'Historial', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full">
        <div className="h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                <span className="text-lg font-bold">{status.icon}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{service.name}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                  {status.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-gray-700 px-6">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-gray-600'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab: Detalles */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Tiempo de respuesta</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatResponseTime(service.responseTime)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Uptime</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatUptime(service.uptime)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Intervalo</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {getIntervalLabel(service.checkInterval)}
                    </p>
                  </div>
                </div>

                {/* Service Info */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Información del Servicio</h3>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-gray-400">URL</span>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 max-w-xs truncate"
                      >
                        {service.url}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-gray-400">Tipo</span>
                      <span className="font-medium text-slate-900 dark:text-white capitalize">
                        {service.type || 'HTTP'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-gray-400">Estado</span>
                      <span className={`font-medium ${status.textColor}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-gray-400">Última verificación</span>
                      <span className="text-slate-900 dark:text-white">{formatDate(service.lastChecked)}</span>
                    </div>
                    {service.description && (
                      <div className="pt-3 border-t border-slate-200 dark:border-gray-700">
                        <span className="text-slate-500 dark:text-gray-400 block mb-1">Descripción</span>
                        <p className="text-slate-900 dark:text-white">{service.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uptime Bar */}
                <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Disponibilidad</h3>
                    <span className="text-lg font-bold text-emerald-600">{formatUptime(service.uptime)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(service.uptime || 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Estadísticas */}
            {activeTab === 'statistics' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Tiempo de respuesta</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatResponseTime(service.responseTime)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Uptime</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatUptime(service.uptime)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Intervalo</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {getIntervalLabel(service.checkInterval)}
                    </p>
                  </div>
                </div>

                {/* Performance Chart */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Rendimiento en el Tiempo</h3>
                  <PerformanceChart serviceId={service.id} />
                </div>

                {/* Status Distribution Charts */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Distribución de Estado</h3>
                  <ServiceCharts logs={service.logs} uptime={service.uptime} />
                </div>

                {/* Additional Stats */}
                {service.logs && service.logs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Resumen de Monitoreo</h3>
                    <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-gray-400">Total de checks</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">{service.logs.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-gray-400">Checks exitosos</p>
                          <p className="text-xl font-bold text-emerald-600">
                            {service.logs.filter(l => l.status === 'online').length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-gray-400">Checks fallidos</p>
                          <p className="text-xl font-bold text-red-600">
                            {service.logs.filter(l => l.status === 'offline').length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-gray-400">Timeouts</p>
                          <p className="text-xl font-bold text-orange-600">
                            {service.logs.filter(l => l.status === 'timeout').length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Historial */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Historial de Verificaciones
                  </h3>
                  {service.logs && (
                    <span className="text-xs text-slate-500 dark:text-gray-400">
                      {service.logs.length} registros
                    </span>
                  )}
                </div>

                {!service.logs || service.logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="w-16 h-16 text-slate-300 dark:text-gray-600 mb-4" />
                    <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      Sin historial
                    </h4>
                    <p className="text-slate-500 dark:text-gray-400 max-w-sm">
                      Aún no hay registros de verificación para este servicio.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div className="divide-y divide-slate-200 dark:divide-gray-700">
                      {service.logs.map((log, idx) => {
                        const logStatus = getStatusConfig(log.status);
                        return (
                          <div
                            key={idx}
                            className={`px-4 py-3 ${
                              log.status === 'online'
                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                                : log.status === 'offline'
                                ? 'bg-red-50/50 dark:bg-red-900/10'
                                : log.status === 'timeout'
                                ? 'bg-orange-50/50 dark:bg-orange-900/10'
                                : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${logStatus.bgColor} ${logStatus.textColor} border ${logStatus.borderColor}`}>
                                  <span className="text-sm font-bold">{logStatus.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${logStatus.textColor}`}>
                                      {logStatus.label}
                                    </span>
                                    {log.responseTime && (
                                      <span className="text-xs text-slate-500 dark:text-gray-400 bg-slate-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                                        {formatResponseTime(log.responseTime)}
                                      </span>
                                    )}
                                  </div>
                                  {log.message && (
                                    <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                                      {log.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}