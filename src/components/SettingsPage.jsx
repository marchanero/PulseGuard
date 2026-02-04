import { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Bell, Shield, History, Wrench,
  ArrowLeft, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock
} from 'lucide-react';
import NotificationChannels from './NotificationChannels';
import AlertRules from './AlertRules';
import MaintenanceWindows from './MaintenanceWindows';

// Notification History Component
function NotificationHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/history?limit=50', { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar historial');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventBadge = (event) => {
    const badges = {
      down: { color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300', label: 'Caído' },
      up: { color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', label: 'Recuperado' },
      degraded: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300', label: 'Degradado' },
      ssl_expiry: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300', label: 'SSL Expirado' },
      ssl_warning: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', label: 'SSL Warning' },
      test: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', label: 'Prueba' }
    };
    return badges[event] || { color: 'bg-slate-100 text-slate-700', label: event };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
          <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historial de Notificaciones</h2>
          <p className="text-sm text-slate-500">Últimas 50 notificaciones enviadas</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* History List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Sin historial
            </h3>
            <p className="text-slate-500">
              Las notificaciones enviadas aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-700">
            {history.map(item => {
              const eventBadge = getEventBadge(item.event);
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.status === 'sent' 
                        ? 'bg-green-100 dark:bg-green-900/50' 
                        : 'bg-red-100 dark:bg-red-900/50'
                    }`}>
                      {item.status === 'sent' 
                        ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      }
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${eventBadge.color}`}>
                          {eventBadge.label}
                        </span>
                        {item.service && (
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.service.name}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-sm text-slate-600 dark:text-gray-300">
                          {item.channel?.name || 'Canal eliminado'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-gray-400 truncate">
                        {item.message}
                      </p>
                      
                      {item.status === 'failed' && item.errorMessage && (
                        <p className="text-xs text-red-500 mt-1">
                          Error: {item.errorMessage}
                        </p>
                      )}
                    </div>
                    
                    {/* Time */}
                    <div className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.sentAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Settings Page Component
export default function SettingsPage({ onBack }) {
  const [activeTab, setActiveTab] = useState('channels');

  const tabs = [
    { id: 'channels', label: 'Canales', icon: Bell, component: NotificationChannels },
    { id: 'rules', label: 'Reglas', icon: Shield, component: AlertRules },
    { id: 'maintenance', label: 'Mantenimiento', icon: Wrench, component: MaintenanceWindows },
    { id: 'history', label: 'Historial', icon: History, component: NotificationHistory }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || NotificationChannels;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">Configuración</h1>
                  <p className="text-xs text-slate-500">Notificaciones y alertas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
