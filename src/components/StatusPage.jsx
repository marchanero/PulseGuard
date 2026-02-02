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
  ExternalLink
} from 'lucide-react';

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

function ServiceStatus({ service }) {
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
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-gray-700">
          <TypeIcon className="w-5 h-5 text-slate-600 dark:text-gray-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {service.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            {service.type} • {service.url}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {service.uptime?.toFixed(2) || '100.00'}% uptime
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {service.responseTime ? `${service.responseTime}ms` : '—'}
          </p>
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

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      if (!response.ok) throw new Error('Error al cargar el estado');
      const statusData = await response.json();
      setData(statusData);
      setLastUpdated(new Date());
      setError(null);
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
                <ServiceStatus key={service.id} service={service} />
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