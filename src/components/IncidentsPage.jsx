import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Calendar, ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function formatDuration(seconds) {
  if (!seconds || seconds < 60) return '< 1 min';
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function IncidentsPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchIncidents(selectedService);
    }
  }, [selectedService, days]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/services`, {
        credentials: 'include'
      });
      const data = await response.json();
      setServices(data);
      if (data.length > 0) {
        setSelectedService(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchIncidents = async (serviceId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/analytics/incidents/${serviceId}?days=${days}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Historial de Incidentes
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Registro de caídas y problemas de servicios
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Servicio
              </label>
              <select
                value={selectedService || ''}
                onChange={(e) => setSelectedService(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
              >
                <option value={7}>Últimos 7 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={60}>Últimos 60 días</option>
                <option value={90}>Últimos 90 días</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && incidents && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {incidents.totalIncidents || 0}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-400">
                    Incidentes totales
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatDuration(incidents.totalDowntime)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-400">
                    Tiempo total de caída
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {incidents.incidents?.length > 0 
                      ? formatDuration(incidents.totalDowntime / incidents.totalIncidents)
                      : '0m'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-400">
                    Duración media
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Incidents List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Lista de Incidentes
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 dark:text-gray-400">Cargando incidentes...</p>
            </div>
          ) : incidents.incidents?.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Sin incidentes
              </h3>
              <p className="text-slate-500 dark:text-gray-400">
                No se han registrado incidentes en el período seleccionado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-gray-700">
              {incidents.incidents?.map((incident, index) => (
                <div key={incident.id} className="p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg mt-1">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          Incidente #{incidents.incidents.length - index}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                          {formatDate(incident.start)}
                        </p>
                        {incident.message && (
                          <p className="text-sm text-slate-600 dark:text-gray-300 mt-2">
                            {incident.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
                        {formatDuration(incident.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}