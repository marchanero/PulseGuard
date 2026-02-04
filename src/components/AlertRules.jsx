import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Plus, Trash2, Check, AlertCircle, 
  Loader2, Bell, BellOff, Clock, Filter,
  ChevronDown, Globe, Server, Edit2
} from 'lucide-react';

// Event configurations
const EVENTS = {
  down: { label: 'Servicio caído', color: 'bg-red-500', description: 'Cuando un servicio pasa a offline o timeout' },
  up: { label: 'Servicio recuperado', color: 'bg-green-500', description: 'Cuando un servicio vuelve a estar online' },
  degraded: { label: 'Servicio degradado', color: 'bg-yellow-500', description: 'Cuando un servicio responde lento' },
  ssl_expiry: { label: 'SSL expirado', color: 'bg-orange-500', description: 'Cuando un certificado SSL expira' },
  ssl_warning: { label: 'SSL próximo a expirar', color: 'bg-amber-500', description: 'Cuando un certificado expira en menos de 14 días' }
};

// Rule Form Component
function RuleForm({ rule, channels, services, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    serviceId: rule?.serviceId || '',
    channelId: rule?.channelId || '',
    events: rule?.events || ['down', 'up'],
    threshold: rule?.threshold || 1,
    cooldown: rule?.cooldown || 300,
    isEnabled: rule?.isEnabled ?? true
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const toggleEvent = (event) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.channelId) {
      newErrors.channelId = 'Debes seleccionar un canal';
    }
    
    if (formData.events.length === 0) {
      newErrors.events = 'Debes seleccionar al menos un evento';
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
        serviceId: formData.serviceId || null,
        channelId: parseInt(formData.channelId)
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
          Aplicar a servicio
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={formData.serviceId}
            onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="">🌐 Todos los servicios (global)</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>{service.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Las reglas globales aplican a todos los servicios
        </p>
      </div>

      {/* Channel Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
          Canal de notificación *
        </label>
        <div className="relative">
          <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={formData.channelId}
            onChange={(e) => setFormData(prev => ({ ...prev, channelId: e.target.value }))}
            className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-700 border rounded-lg text-sm focus:outline-none appearance-none ${
              errors.channelId ? 'border-red-500' : 'border-slate-200 dark:border-gray-600 focus:border-indigo-500'
            }`}
          >
            <option value="">Selecciona un canal...</option>
            {channels.map(channel => (
              <option key={channel.id} value={channel.id}>
                {channel.name} ({channel.type})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {errors.channelId && <p className="text-xs text-red-500 mt-1">{errors.channelId}</p>}
      </div>

      {/* Events Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-2">
          Eventos a notificar *
        </label>
        <div className="space-y-2">
          {Object.entries(EVENTS).map(([key, event]) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.events.includes(key)
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-slate-200 dark:border-gray-600 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.events.includes(key)}
                onChange={() => toggleEvent(key)}
                className="sr-only"
              />
              <div className={`w-3 h-3 rounded-full ${event.color}`} />
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{event.label}</span>
                <p className="text-xs text-slate-500">{event.description}</p>
              </div>
              {formData.events.includes(key) && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </label>
          ))}
        </div>
        {errors.events && <p className="text-xs text-red-500 mt-1">{errors.events}</p>}
      </div>

      {/* Advanced Options */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-gray-700">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
            Umbral de fallos
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              min="1"
              max="10"
              value={formData.threshold}
              onChange={(e) => setFormData(prev => ({ ...prev, threshold: parseInt(e.target.value) || 1 }))}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fallos consecutivos antes de notificar
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
            Cooldown (segundos)
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={formData.cooldown}
              onChange={(e) => setFormData(prev => ({ ...prev, cooldown: parseInt(e.target.value) }))}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value={60}>1 minuto</option>
              <option value={300}>5 minutos</option>
              <option value={600}>10 minutos</option>
              <option value={1800}>30 minutos</option>
              <option value={3600}>1 hora</option>
              <option value={86400}>24 horas</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tiempo entre notificaciones repetidas
          </p>
        </div>
      </div>

      {/* Enabled Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isEnabled}
          onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
          className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-slate-700 dark:text-gray-300">Regla habilitada</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {rule ? 'Actualizar' : 'Crear'} Regla
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

// Rule Card Component
function RuleCard({ rule, onEdit, onDelete, onToggle }) {
  const formatCooldown = (seconds) => {
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)}d`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
    return `${seconds}s`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
      rule.isEnabled ? 'border-slate-200 dark:border-gray-700' : 'border-slate-200 dark:border-gray-700 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Target */}
          <div className="flex items-center gap-2 mb-2">
            {rule.service ? (
              <div className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">{rule.service.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-indigo-600 dark:text-indigo-400">Todos los servicios</span>
              </div>
            )}
            <span className="text-slate-400">→</span>
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-gray-300">{rule.channel?.name || 'Canal eliminado'}</span>
            </div>
          </div>

          {/* Events */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {rule.events.map(event => {
              const eventConfig = EVENTS[event];
              return eventConfig ? (
                <span
                  key={event}
                  className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${eventConfig.color}`}
                >
                  {eventConfig.label}
                </span>
              ) : null;
            })}
          </div>

          {/* Settings */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Umbral: {rule.threshold}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Cooldown: {formatCooldown(rule.cooldown)}
            </span>
            {!rule.isEnabled && (
              <span className="flex items-center gap-1 text-amber-500">
                <BellOff className="w-3 h-3" />
                Deshabilitada
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(rule.id, !rule.isEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              rule.isEnabled 
                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30' 
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700'
            }`}
            title={rule.isEnabled ? 'Deshabilitar' : 'Habilitar'}
          >
            {rule.isEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(rule)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(rule.id)}
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
export default function AlertRules() {
  const [rules, setRules] = useState([]);
  const [channels, setChannels] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, channelsRes, servicesRes] = await Promise.all([
        fetch('/api/notifications/rules', { credentials: 'include' }),
        fetch('/api/notifications/channels', { credentials: 'include' }),
        fetch('/api/services', { credentials: 'include' })
      ]);

      if (!rulesRes.ok || !channelsRes.ok || !servicesRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const [rulesData, channelsData, servicesData] = await Promise.all([
        rulesRes.json(),
        channelsRes.json(),
        servicesRes.json()
      ]);

      setRules(rulesData);
      setChannels(channelsData);
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
      const url = editingRule 
        ? `/api/notifications/rules/${editingRule.id}`
        : '/api/notifications/rules';
      
      const response = await fetch(url, {
        method: editingRule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar regla');
      }

      await fetchData();
      setShowForm(false);
      setEditingRule(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('¿Estás seguro de eliminar esta regla?')) return;

    try {
      const response = await fetch(`/api/notifications/rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Error al eliminar regla');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (ruleId, isEnabled) => {
    try {
      const response = await fetch(`/api/notifications/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isEnabled })
      });

      if (!response.ok) throw new Error('Error al actualizar regla');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const hasChannels = channels.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reglas de Alerta</h2>
            <p className="text-sm text-slate-500">Define cuándo y cómo notificar sobre cambios en tus servicios</p>
          </div>
        </div>
        {!showForm && hasChannels && (
          <button
            onClick={() => { setEditingRule(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Regla
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* No Channels Warning */}
      {!hasChannels && !showForm && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Primero configura un canal de notificación</span>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Necesitas al menos un canal (Discord, Slack, Email, etc.) antes de crear reglas de alerta.
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {editingRule ? 'Editar Regla' : 'Nueva Regla de Alerta'}
          </h3>
          <RuleForm
            rule={editingRule}
            channels={channels}
            services={services}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingRule(null); }}
          />
        </div>
      )}

      {/* Rules List */}
      {!showForm && hasChannels && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
              <Shield className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No hay reglas de alerta
              </h3>
              <p className="text-slate-500 mb-4">
                Crea una regla para empezar a recibir notificaciones cuando tus servicios cambien de estado
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Regla
              </button>
            </div>
          ) : (
            rules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>
      )}

      {/* Help Box */}
      <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">¿Cómo funcionan las reglas?</h4>
        <ul className="text-sm text-slate-600 dark:text-gray-300 space-y-1">
          <li>• Las <strong>reglas globales</strong> aplican a todos los servicios</li>
          <li>• Las <strong>reglas específicas</strong> solo aplican al servicio seleccionado</li>
          <li>• El <strong>umbral</strong> define cuántos fallos consecutivos se necesitan antes de notificar</li>
          <li>• El <strong>cooldown</strong> evita notificaciones repetidas en un periodo de tiempo</li>
        </ul>
      </div>
    </div>
  );
}
