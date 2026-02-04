import { useState, useEffect, useCallback } from 'react';
import { 
  Wrench, Plus, Trash2, Edit2, Check, X, Calendar,
  Clock, AlertCircle, Loader2, ChevronDown, Server,
  RefreshCw, Eye, EyeOff
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Maintenance Form Component
function MaintenanceForm({ window: maintenanceWindow, services, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    serviceId: maintenanceWindow?.serviceId || '',
    title: maintenanceWindow?.title || '',
    description: maintenanceWindow?.description || '',
    startTime: maintenanceWindow?.startTime || '',
    endTime: maintenanceWindow?.endTime || '',
    isRecurring: maintenanceWindow?.isRecurring || false,
    recurringPattern: maintenanceWindow?.recurringPattern || { type: 'weekly', interval: 1, daysOfWeek: [] }
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Set default times (now and 2 hours later)
  useEffect(() => {
    if (!maintenanceWindow && !formData.startTime) {
      const now = new Date();
      const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      setFormData(prev => ({
        ...prev,
        startTime: now.toISOString().slice(0, 16),
        endTime: later.toISOString().slice(0, 16)
      }));
    }
  }, [maintenanceWindow, formData.startTime]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'La fecha de inicio es requerida';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'La fecha de fin es requerida';
    }
    
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      newErrors.endTime = 'La fecha de fin debe ser posterior a la de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        serviceId: formData.serviceId || null
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
          Servicio (opcional)
        </label>
        <div className="relative">
          <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={formData.serviceId}
            onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-amber-500 appearance-none"
          >
            <option value="">🌐 Todos los servicios</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>{service.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Si no seleccionas un servicio, el mantenimiento aplicará a todos
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
          Título *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Actualización del servidor"
          className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border rounded-lg text-sm focus:outline-none ${
            errors.title ? 'border-red-500' : 'border-slate-200 dark:border-gray-600 focus:border-amber-500'
          }`}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detalles sobre el mantenimiento programado..."
          rows={3}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Date/Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
            Inicio *
          </label>
          <input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border rounded-lg text-sm focus:outline-none ${
              errors.startTime ? 'border-red-500' : 'border-slate-200 dark:border-gray-600 focus:border-amber-500'
            }`}
          />
          {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
            Fin *
          </label>
          <input
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border rounded-lg text-sm focus:outline-none ${
              errors.endTime ? 'border-red-500' : 'border-slate-200 dark:border-gray-600 focus:border-amber-500'
            }`}
          />
          {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {maintenanceWindow ? 'Actualizar' : 'Programar'} Mantenimiento
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// Maintenance Card Component
function MaintenanceCard({ window: maintenanceWindow, onEdit, onDelete, onToggle }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = () => {
    const start = new Date(maintenanceWindow.startTime);
    const end = new Date(maintenanceWindow.endTime);
    const hours = Math.round((end - start) / (1000 * 60 * 60));
    return hours === 1 ? '1 hora' : `${hours} horas`;
  };

  const getStatus = () => {
    const now = new Date();
    const start = new Date(maintenanceWindow.startTime);
    const end = new Date(maintenanceWindow.endTime);
    
    if (now >= start && now <= end) {
      return { label: 'En progreso', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' };
    } else if (now < start) {
      return { label: 'Programado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' };
    } else {
      return { label: 'Finalizado', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' };
    }
  };

  const status = getStatus();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
      maintenanceWindow.isActive ? 'border-slate-200 dark:border-gray-700' : 'border-slate-200 dark:border-gray-700 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {maintenanceWindow.title}
            </h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${status.color}`}>
              {status.label}
            </span>
            {!maintenanceWindow.isActive && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-500 text-xs rounded">
                Desactivado
              </span>
            )}
          </div>

          {/* Service */}
          {maintenanceWindow.service && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-400 mb-2">
              <Server className="w-3.5 h-3.5" />
              <span>{maintenanceWindow.service.name}</span>
            </div>
          )}

          {/* Description */}
          {maintenanceWindow.description && (
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
              {maintenanceWindow.description}
            </p>
          )}

          {/* Time Info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(maintenanceWindow.startTime)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getDuration()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(maintenanceWindow.id, !maintenanceWindow.isActive)}
            className={`p-2 rounded-lg transition-colors ${
              maintenanceWindow.isActive 
                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30' 
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700'
            }`}
            title={maintenanceWindow.isActive ? 'Desactivar' : 'Activar'}
          >
            {maintenanceWindow.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(maintenanceWindow)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(maintenanceWindow.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function MaintenanceWindows() {
  const [windows, setWindows] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWindow, setEditingWindow] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [windowsRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/maintenance`, { credentials: 'include' }),
        fetch(`${API_URL}/services`, { credentials: 'include' })
      ]);

      if (!windowsRes.ok || !servicesRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const [windowsData, servicesData] = await Promise.all([
        windowsRes.json(),
        servicesRes.json()
      ]);

      setWindows(windowsData);
      setServices(servicesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (formData) => {
    try {
      const url = editingWindow 
        ? `${API_URL}/maintenance/${editingWindow.id}`
        : `${API_URL}/maintenance`;
      
      const response = await fetch(url, {
        method: editingWindow ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar mantenimiento');
      }

      await fetchData();
      setShowForm(false);
      setEditingWindow(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (windowId) => {
    if (!confirm('¿Estás seguro de eliminar esta ventana de mantenimiento?')) return;

    try {
      const response = await fetch(`${API_URL}/maintenance/${windowId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Error al eliminar mantenimiento');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (windowId, isActive) => {
    try {
      const response = await fetch(`${API_URL}/maintenance/${windowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) throw new Error('Error al actualizar mantenimiento');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (window) => {
    setEditingWindow(window);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ventanas de Mantenimiento</h2>
            <p className="text-sm text-slate-500">Programa mantenimientos para evitar falsas alarmas</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditingWindow(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Programar Mantenimiento
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {editingWindow ? 'Editar Mantenimiento' : 'Programar Nuevo Mantenimiento'}
          </h3>
          <MaintenanceForm
            window={editingWindow}
            services={services}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingWindow(null); }}
          />
        </div>
      )}

      {/* Windows List */}
      {!showForm && (
        <div className="space-y-3">
          {windows.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
              <Wrench className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No hay mantenimientos programados
              </h3>
              <p className="text-slate-500 mb-4">
                Programa ventanas de mantenimiento para evitar que se envíen alertas durante actualizaciones planificadas
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Programar Mantenimiento
              </button>
            </div>
          ) : (
            windows.map(window => (
              <MaintenanceCard
                key={window.id}
                window={window}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4" />
          ¿Cómo funcionan las ventanas de mantenimiento?
        </h4>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
          <li>• Durante una ventana de mantenimiento activa, <strong>no se enviarán notificaciones</strong> para los servicios afectados</li>
          <li>• El monitoreo continúa normalmente, solo se suprimen las alertas</li>
          <li>• Puedes programar mantenimientos para un servicio específico o para todos</li>
          <li>• Las ventanas pueden activarse/desactivarse sin eliminarlas</li>
        </ul>
      </div>
    </div>
  );
}
