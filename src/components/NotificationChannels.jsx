import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Plus, Trash2, Settings, TestTube, Check, X, 
  Webhook, MessageSquare, Mail, Send, AlertCircle, 
  Loader2, ChevronDown, ChevronUp, Edit2, ExternalLink
} from 'lucide-react';

// Channel type configurations
const CHANNEL_TYPES = {
  webhook: {
    name: 'Webhook',
    icon: Webhook,
    color: 'bg-purple-500',
    description: 'Envía datos JSON a cualquier URL',
    fields: [
      { name: 'url', label: 'URL del Webhook', type: 'url', required: true, placeholder: 'https://api.ejemplo.com/webhook' },
      { name: 'method', label: 'Método HTTP', type: 'select', options: ['POST', 'PUT', 'PATCH'], default: 'POST' },
      { name: 'headers', label: 'Headers (JSON)', type: 'json', placeholder: '{"Authorization": "Bearer token"}' }
    ]
  },
  discord: {
    name: 'Discord',
    icon: MessageSquare,
    color: 'bg-indigo-500',
    description: 'Notificaciones a un canal de Discord',
    fields: [
      { name: 'webhookUrl', label: 'URL del Webhook', type: 'url', required: true, placeholder: 'https://discord.com/api/webhooks/...' },
      { name: 'username', label: 'Nombre del Bot', type: 'text', placeholder: 'PulseGuard' },
      { name: 'avatarUrl', label: 'URL del Avatar', type: 'url', placeholder: 'https://...' },
      { name: 'mentionEveryone', label: 'Mencionar @everyone', type: 'checkbox' },
      { name: 'mentionRole', label: 'ID del Rol a mencionar', type: 'text', placeholder: '123456789' }
    ],
    helpUrl: 'https://support.discord.com/hc/en-us/articles/228383668'
  },
  slack: {
    name: 'Slack',
    icon: MessageSquare,
    color: 'bg-green-500',
    description: 'Notificaciones a un canal de Slack',
    fields: [
      { name: 'webhookUrl', label: 'URL del Webhook', type: 'url', required: true, placeholder: 'https://hooks.slack.com/services/...' },
      { name: 'channel', label: 'Canal', type: 'text', placeholder: '#monitoring' },
      { name: 'username', label: 'Nombre del Bot', type: 'text', placeholder: 'PulseGuard' },
      { name: 'iconEmoji', label: 'Emoji del Bot', type: 'text', placeholder: ':shield:' },
      { name: 'mentionChannel', label: 'Mencionar @channel', type: 'checkbox' }
    ],
    helpUrl: 'https://api.slack.com/messaging/webhooks'
  },
  telegram: {
    name: 'Telegram',
    icon: Send,
    color: 'bg-blue-500',
    description: 'Notificaciones a un chat de Telegram',
    fields: [
      { name: 'botToken', label: 'Token del Bot', type: 'password', required: true, placeholder: '123456789:ABC...' },
      { name: 'chatId', label: 'Chat ID', type: 'text', required: true, placeholder: '-1001234567890' },
      { name: 'disablePreview', label: 'Desactivar preview de links', type: 'checkbox' }
    ],
    helpUrl: 'https://core.telegram.org/bots#how-do-i-create-a-bot'
  },
  email: {
    name: 'Email (SMTP)',
    icon: Mail,
    color: 'bg-red-500',
    description: 'Enviar emails vía SMTP',
    fields: [
      { name: 'smtpHost', label: 'Host SMTP', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
      { name: 'smtpPort', label: 'Puerto SMTP', type: 'number', required: true, placeholder: '587' },
      { name: 'smtpSecure', label: 'Usar SSL/TLS', type: 'checkbox' },
      { name: 'smtpUser', label: 'Usuario SMTP', type: 'text', placeholder: 'user@gmail.com' },
      { name: 'smtpPass', label: 'Contraseña SMTP', type: 'password', placeholder: '********' },
      { name: 'fromEmail', label: 'Email remitente', type: 'email', required: true, placeholder: 'alerts@ejemplo.com' },
      { name: 'toEmails', label: 'Emails destinatarios', type: 'tags', required: true, placeholder: 'admin@ejemplo.com' }
    ]
  }
};

// Channel Form Component
function ChannelForm({ channel, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: channel?.name || '',
    type: channel?.type || 'webhook',
    config: channel?.config || {},
    isEnabled: channel?.isEnabled ?? true,
    isDefault: channel?.isDefault ?? false
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const typeConfig = CHANNEL_TYPES[formData.type];

  const handleTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      config: {} // Reset config when type changes
    }));
    setErrors({});
  };

  const handleConfigChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [fieldName]: value }
    }));
  };

  const handleTagsChange = (fieldName, value) => {
    // Split by comma and trim whitespace
    const tags = value.split(',').map(t => t.trim()).filter(Boolean);
    handleConfigChange(fieldName, tags);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Validate required fields
    typeConfig.fields.forEach(field => {
      if (field.required && !formData.config[field.name]) {
        newErrors[field.name] = `${field.label} es requerido`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field) => {
    const value = formData.config[field.name] || '';
    const error = errors[field.name];

    switch (field.type) {
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleConfigChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700 dark:text-gray-300">{field.label}</span>
          </label>
        );

      case 'select':
        return (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
              {field.label}
            </label>
            <select
              value={value || field.default}
              onChange={(e) => handleConfigChange(field.name, e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            >
              {field.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'tags':
        return (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && '*'}
            </label>
            <input
              type="text"
              value={Array.isArray(value) ? value.join(', ') : value}
              onChange={(e) => handleTagsChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border rounded-lg text-sm focus:outline-none ${
                error ? 'border-red-500' : 'border-slate-200 dark:border-gray-600 focus:border-indigo-500'
              }`}
            />
            <p className="text-xs text-slate-500 mt-1">Separar múltiples valores con comas</p>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'json':
        return (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
              {field.label}
            </label>
            <textarea
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => {
                try {
                  handleConfigChange(field.name, JSON.parse(e.target.value));
                } catch {
                  handleConfigChange(field.name, e.target.value);
                }
              }}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && '*'}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleConfigChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border rounded-lg text-sm focus:outline-none ${
                error ? 'border-red-500' : 'border-slate-200 dark:border-gray-600 focus:border-indigo-500'
              }`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Channel Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
          Nombre del canal *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Mi webhook de Discord"
          className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border rounded-lg text-sm focus:outline-none ${
            errors.name ? 'border-red-500' : 'border-slate-200 dark:border-gray-600 focus:border-indigo-500'
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Channel Type Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-2">
          Tipo de canal *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CHANNEL_TYPES).map(([key, type]) => {
            const Icon = type.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTypeChange(key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                  formData.type === key
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-slate-200 dark:border-gray-600 hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{type.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-2">{typeConfig.description}</p>
        {typeConfig.helpUrl && (
          <a 
            href={typeConfig.helpUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ver guía de configuración
          </a>
        )}
      </div>

      {/* Type-specific fields */}
      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-gray-700">
        {typeConfig.fields.map(field => (
          <div key={field.name}>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="flex items-center gap-4 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isEnabled}
            onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700 dark:text-gray-300">Habilitado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700 dark:text-gray-300">Canal por defecto</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {channel ? 'Actualizar' : 'Crear'} Canal
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

// Channel Card Component
function ChannelCard({ channel, onEdit, onDelete, onTest }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const typeConfig = CHANNEL_TYPES[channel.type] || CHANNEL_TYPES.webhook;
  const Icon = typeConfig.icon;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(channel.id);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${
      channel.isEnabled ? 'border-slate-200 dark:border-gray-700' : 'border-slate-200 dark:border-gray-700 opacity-60'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${typeConfig.color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{channel.name}</h3>
                {channel.isDefault && (
                  <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs rounded">
                    Por defecto
                  </span>
                )}
                {!channel.isEnabled && (
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-500 text-xs rounded">
                    Deshabilitado
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{typeConfig.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={isTesting || !channel.isEnabled}
              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
              title="Probar canal"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(channel)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(channel.id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-3 p-2 rounded-lg text-sm flex items-center gap-2 ${
            testResult.success 
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {testResult.success ? (
              <><Check className="w-4 h-4" /> Notificación de prueba enviada correctamente</>
            ) : (
              <><AlertCircle className="w-4 h-4" /> Error: {testResult.error}</>
            )}
          </div>
        )}

        {/* Expanded Config */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Configuración</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(channel.config).map(([key, value]) => {
                // Don't show passwords
                if (key.toLowerCase().includes('pass') || key.toLowerCase().includes('token')) {
                  value = '••••••••';
                }
                return (
                  <div key={key} className="flex">
                    <span className="text-slate-500 w-32 flex-shrink-0">{key}:</span>
                    <span className="text-slate-700 dark:text-gray-300 truncate">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Component
export default function NotificationChannels() {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/channels', { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar canales');
      const data = await response.json();
      setChannels(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleSave = async (formData) => {
    try {
      const url = editingChannel 
        ? `/api/notifications/channels/${editingChannel.id}`
        : '/api/notifications/channels';
      
      const response = await fetch(url, {
        method: editingChannel ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar canal');
      }

      await fetchChannels();
      setShowForm(false);
      setEditingChannel(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (channelId) => {
    if (!confirm('¿Estás seguro de eliminar este canal?')) return;

    try {
      const response = await fetch(`/api/notifications/channels/${channelId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Error al eliminar canal');
      await fetchChannels();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTest = async (channelId) => {
    try {
      const response = await fetch(`/api/notifications/channels/${channelId}/test`, {
        method: 'POST',
        credentials: 'include'
      });

      return await response.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleEdit = (channel) => {
    setEditingChannel(channel);
    setShowForm(true);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Canales de Notificación</h2>
            <p className="text-sm text-slate-500">Configura dónde recibir alertas cuando tus servicios cambien de estado</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditingChannel(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Añadir Canal
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
            {editingChannel ? 'Editar Canal' : 'Nuevo Canal de Notificación'}
          </h3>
          <ChannelForm
            channel={editingChannel}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingChannel(null); }}
          />
        </div>
      )}

      {/* Channels List */}
      {!showForm && (
        <div className="space-y-3">
          {channels.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
              <Bell className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No hay canales configurados
              </h3>
              <p className="text-slate-500 mb-4">
                Añade un canal para recibir notificaciones cuando tus servicios cambien de estado
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Añadir Canal
              </button>
            </div>
          ) : (
            channels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTest}
              />
            ))
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4" />
          Integraciones soportadas
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(CHANNEL_TYPES).map(([key, type]) => {
            const Icon = type.icon;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-6 h-6 ${type.color} rounded flex items-center justify-center`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-blue-800 dark:text-blue-200">{type.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
