import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Edit2, Send, Clock, CheckCircle, XCircle, ExternalLink, Loader } from 'lucide-react';
import { useToast } from '../hooks/useToast';

function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [history, setHistory] = useState([]);
  const [testingWebhook, setTestingWebhook] = useState(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    headers: {},
    events: [],
    services: []
  });

  const [newHeader, setNewHeader] = useState({ key: '', value: '' });

  useEffect(() => {
    loadWebhooks();
    loadServices();
  }, []);

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error('Error al cargar webhooks:', error);
      showToast('Error al cargar webhooks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data.filter(s => !s.isDeleted));
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  };

  const loadHistory = async (webhookId) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/history?limit=20`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.url) {
      showToast('Nombre y URL son requeridos', 'error');
      return;
    }

    try {
      const url = editingWebhook 
        ? `/api/webhooks/${editingWebhook.id}`
        : '/api/webhooks';
      
      const method = editingWebhook ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(
          editingWebhook ? 'Webhook actualizado' : 'Webhook creado',
          'success'
        );
        setShowForm(false);
        setEditingWebhook(null);
        resetForm();
        loadWebhooks();
      } else {
        const error = await response.json();
        showToast(error.error || 'Error al guardar webhook', 'error');
      }
    } catch (error) {
      console.error('Error al guardar webhook:', error);
      showToast('Error al guardar webhook', 'error');
    }
  };

  const handleDelete = async (webhookId) => {
    if (!confirm('¿Estás seguro de eliminar este webhook?')) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        showToast('Webhook eliminado', 'success');
        loadWebhooks();
      } else {
        showToast('Error al eliminar webhook', 'error');
      }
    } catch (error) {
      console.error('Error al eliminar webhook:', error);
      showToast('Error al eliminar webhook', 'error');
    }
  };

  const handleTest = async (webhookId) => {
    setTestingWebhook(webhookId);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(`Webhook enviado correctamente (${result.statusCode})`, 'success');
      } else {
        showToast(result.error || 'Error al enviar webhook', 'error');
      }
      
      // Recargar historial si está abierto
      if (selectedWebhook === webhookId) {
        loadHistory(webhookId);
      }
    } catch (error) {
      console.error('Error al probar webhook:', error);
      showToast('Error al probar webhook', 'error');
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleEdit = (webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.config.url,
      method: webhook.config.method || 'POST',
      headers: webhook.config.headers || {},
      events: [],
      services: webhook.rules.map(r => r.serviceId)
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      method: 'POST',
      headers: {},
      events: [],
      services: []
    });
    setNewHeader({ key: '', value: '' });
  };

  const addHeader = () => {
    if (newHeader.key && newHeader.value) {
      setFormData(prev => ({
        ...prev,
        headers: {
          ...prev.headers,
          [newHeader.key]: newHeader.value
        }
      }));
      setNewHeader({ key: '', value: '' });
    }
  };

  const removeHeader = (key) => {
    const { [key]: _, ...rest } = formData.headers;
    setFormData(prev => ({ ...prev, headers: rest }));
  };

  const toggleEvent = (event) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const toggleService = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const eventOptions = [
    { value: 'down', label: '🔴 Servicio caído', color: 'text-red-600' },
    { value: 'up', label: '🟢 Servicio recuperado', color: 'text-green-600' },
    { value: 'degraded', label: '🟡 Rendimiento degradado', color: 'text-yellow-600' },
    { value: 'ssl_expiry', label: '⚠️ SSL expira pronto', color: 'text-orange-600' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Webhooks
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Notificaciones HTTP cuando cambia el estado de tus servicios
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingWebhook(null);
            resetForm();
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Webhook
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingWebhook ? 'Editar Webhook' : 'Nuevo Webhook'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                  placeholder="Mi Webhook"
                  required
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-mono text-sm"
                  placeholder="https://mi-servidor.com/webhook"
                  required
                />
              </div>

              {/* Método HTTP */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Método HTTP
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                >
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              {/* Headers personalizados */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Headers HTTP (opcional)
                </label>
                <div className="space-y-2">
                  {Object.entries(formData.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={key}
                        disabled
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-600 text-slate-900 dark:text-white text-sm font-mono"
                      />
                      <input
                        type="text"
                        value={value}
                        disabled
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-600 text-slate-900 dark:text-white text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(key)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newHeader.key}
                      onChange={(e) => setNewHeader(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="Authorization"
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm font-mono"
                    />
                    <input
                      type="text"
                      value={newHeader.value}
                      onChange={(e) => setNewHeader(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Bearer token123"
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={addHeader}
                      className="px-4 py-2 bg-slate-200 dark:bg-gray-600 hover:bg-slate-300 dark:hover:bg-gray-500 text-slate-700 dark:text-white rounded-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Eventos */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Eventos que disparan la notificación
                </label>
                <div className="space-y-2">
                  {eventOptions.map(event => (
                    <label
                      key={event.value}
                      className="flex items-center gap-2 p-3 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className={`${event.color} dark:text-white`}>
                        {event.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Servicios */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Servicios a monitorear
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-gray-700 rounded-lg p-3">
                  {services.map(service => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-900 dark:text-white">
                        {service.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingWebhook(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editingWebhook ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Webhooks */}
      <div className="grid gap-4">
        {webhooks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
            <Bell className="w-16 h-16 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No hay webhooks configurados
            </h3>
            <p className="text-slate-600 dark:text-gray-400">
              Crea tu primer webhook para recibir notificaciones
            </p>
          </div>
        ) : (
          webhooks.map(webhook => (
            <div
              key={webhook.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {webhook.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      webhook.isEnabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400'
                    }`}>
                      {webhook.isEnabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 font-mono">
                    <ExternalLink className="w-4 h-4" />
                    {webhook.config.url}
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-gray-400">
                    <span className="font-medium">{webhook.config.method || 'POST'}</span>
                    {' • '}
                    {webhook.rules.length} {webhook.rules.length === 1 ? 'servicio' : 'servicios'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(webhook.id)}
                    disabled={testingWebhook === webhook.id}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"
                    title="Probar webhook"
                  >
                    {testingWebhook === webhook.id ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(webhook)}
                    className="p-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Historial */}
              <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => {
                    if (selectedWebhook === webhook.id) {
                      setSelectedWebhook(null);
                    } else {
                      setSelectedWebhook(webhook.id);
                      loadHistory(webhook.id);
                    }
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {selectedWebhook === webhook.id ? 'Ocultar' : 'Ver'} historial
                </button>

                {selectedWebhook === webhook.id && (
                  <div className="mt-3 space-y-2">
                    {history.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-3">
                          {item.status === 'sent' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-slate-900 dark:text-white">
                            {item.message}
                          </span>
                        </div>
                        <span className="text-slate-500 dark:text-gray-400">
                          {new Date(item.sentAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WebhookManager;
