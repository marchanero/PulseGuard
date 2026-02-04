import { useState } from 'react';
import { Plus, X, Eye, EyeOff, Key, FileText, Shield } from 'lucide-react';
import { Button } from './ui';

/**
 * HeadersEditor - Componente para gestionar headers HTTP personalizados
 * Permite agregar, editar y eliminar pares key-value de headers
 */
function HeadersEditor({ headers, onChange }) {
  const [headersList, setHeadersList] = useState(() => {
    // Convertir objeto de headers a array para facilitar la edición
    if (!headers || Object.keys(headers).length === 0) {
      return [{ key: '', value: '', isSecret: false, id: Date.now() }];
    }
    return Object.entries(headers).map(([key, value], index) => ({
      key,
      value,
      isSecret: key.toLowerCase().includes('auth') || key.toLowerCase().includes('token') || key.toLowerCase().includes('key'),
      id: Date.now() + index
    }));
  });

  const [showSecrets, setShowSecrets] = useState({});

  // Notificar cambios al padre
  const notifyChange = (updatedList) => {
    const headersObject = {};
    updatedList.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        headersObject[key.trim()] = value.trim();
      }
    });
    onChange(headersObject);
  };

  const addHeader = () => {
    const newList = [...headersList, { key: '', value: '', isSecret: false, id: Date.now() }];
    setHeadersList(newList);
  };

  const removeHeader = (id) => {
    const newList = headersList.filter(h => h.id !== id);
    setHeadersList(newList);
    notifyChange(newList);
  };

  const updateHeader = (id, field, value) => {
    const newList = headersList.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    );
    setHeadersList(newList);
    notifyChange(newList);
  };

  const toggleSecret = (id) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Plantillas de headers comunes
  const commonHeaders = [
    { key: 'Authorization', value: 'Bearer YOUR_TOKEN_HERE', icon: Shield, description: 'Token de autenticación Bearer' },
    { key: 'X-API-Key', value: 'your-api-key-here', icon: Key, description: 'API Key personalizada' },
    { key: 'Content-Type', value: 'application/json', icon: FileText, description: 'Tipo de contenido JSON' },
    { key: 'Accept', value: 'application/json', icon: FileText, description: 'Acepta JSON como respuesta' },
    { key: 'User-Agent', value: 'CustomMonitor/1.0', icon: Shield, description: 'Agente de usuario personalizado' }
  ];

  const insertTemplate = (template) => {
    const newList = [...headersList];
    const emptyIndex = newList.findIndex(h => !h.key && !h.value);
    const newId = Date.now();
    
    const newHeader = { 
      ...template, 
      isSecret: template.key.toLowerCase().includes('auth') || 
                template.key.toLowerCase().includes('token') || 
                template.key.toLowerCase().includes('key'),
      id: newId 
    };
    
    if (emptyIndex >= 0) {
      newList[emptyIndex] = newHeader;
    } else {
      newList.push(newHeader);
    }
    
    setHeadersList(newList);
    notifyChange(newList);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Headers HTTP Personalizados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Agrega headers para autenticación o configuración personalizada
          </p>
        </div>
      </div>

      {/* Plantillas rápidas */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
          Plantillas comunes:
        </p>
        <div className="flex flex-wrap gap-2">
          {commonHeaders.map((template, index) => {
            const Icon = template.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => insertTemplate(template)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium 
                         bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 
                         border border-slate-200 dark:border-slate-600 rounded-md
                         hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                title={template.description}
              >
                <Icon className="w-3 h-3" />
                {template.key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de headers */}
      <div className="space-y-2">
        {headersList.map((header) => (
          <div key={header.id} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="Header Name (ej: Authorization)"
                  value={header.key}
                  onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 
                           rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                           placeholder-slate-400 dark:placeholder-slate-500
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <input
                  type={showSecrets[header.id] || !header.isSecret ? 'text' : 'password'}
                  placeholder="Header Value (ej: Bearer token123)"
                  value={header.value}
                  onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 dark:border-slate-600 
                           rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                           placeholder-slate-400 dark:placeholder-slate-500
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {header.isSecret && header.value && (
                  <button
                    type="button"
                    onClick={() => toggleSecret(header.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 
                             text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showSecrets[header.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => removeHeader(header.id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 
                       dark:hover:bg-red-900/20 rounded-lg transition-colors mt-0.5"
              title="Eliminar header"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Botón agregar */}
      <button
        type="button"
        onClick={addHeader}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium 
                 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 
                 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar otro header
      </button>

      {/* Info adicional */}
      {headersList.some(h => h.key && h.value) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> Los headers se enviarán en cada verificación del servicio. 
            Útil para APIs con autenticación o configuraciones especiales.
          </p>
        </div>
      )}
    </div>
  );
}

export default HeadersEditor;
