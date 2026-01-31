import { useState } from 'react';

function ServiceForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    checkInterval: 60,
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'La URL es requerida';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'La URL no es válida (ej: https://ejemplo.com)';
    }
    
    if (formData.checkInterval < 10 || formData.checkInterval > 3600) {
      newErrors.checkInterval = 'El intervalo debe estar entre 10 segundos y 1 hora';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      setIsSubmitting(true);
      await onSubmit(formData);
      setIsSubmitting(false);
      setFormData({ name: '', url: '', description: '', checkInterval: 60, isActive: true });
      setErrors({});
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatInterval = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds === 60) return '1 min';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Añadir Nuevo Servicio
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Completa los datos para monitorizar un nuevo servicio
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
              Nombre del servicio *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-700 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                  errors.name 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                    : 'border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                placeholder="Ej: API Principal"
              />
            </div>
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
              URL del servicio *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-700 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                  errors.url 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                    : 'border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                placeholder="https://api.ejemplo.com"
              />
            </div>
            {errors.url && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.url}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="checkInterval" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
              Intervalo de verificación
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                type="number"
                id="checkInterval"
                name="checkInterval"
                min="10"
                max="3600"
                value={formData.checkInterval}
                onChange={handleChange}
                className={`w-full pl-10 pr-20 py-3 bg-slate-50 dark:bg-gray-700 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                  errors.checkInterval 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                    : 'border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                } text-slate-900 dark:text-white placeholder-slate-400`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-sm text-slate-500 dark:text-gray-400">
                  {formatInterval(formData.checkInterval)}
                </span>
              </div>
            </div>
            {errors.checkInterval && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.checkInterval}</p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              Mínimo: 10 segundos, Máximo: 1 hora
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
              Estado inicial
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Monitoreo activo
                </span>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Iniciar verificación automática inmediatamente
                </p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
              placeholder="Descripción opcional del servicio..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Guardar Servicio</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ServiceForm;
