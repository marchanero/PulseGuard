import { useState } from 'react';
import { Plus, Globe, Clock, FileText, Check, AlertCircle } from 'lucide-react';

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

  const intervalOptions = [
    { value: 10, label: '10 segundos' },
    { value: 30, label: '30 segundos' },
    { value: 60, label: '1 minuto' },
    { value: 300, label: '5 minutos' },
    { value: 900, label: '15 minutos' },
    { value: 1800, label: '30 minutos' },
    { value: 3600, label: '1 hora' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
          <Plus className="w-5 h-5 text-white dark:text-slate-900" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Añadir servicio
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Monitoriza un nuevo servicio
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & URL Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Nombre *
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-700 border rounded-lg focus:outline-none transition-all text-sm ${
                  errors.name 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                    : 'border-slate-200 dark:border-gray-600 focus:border-slate-900 dark:focus:border-white'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                placeholder="Ej: API Principal"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="url" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              URL *
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-gray-700 border rounded-lg focus:outline-none transition-all text-sm ${
                  errors.url 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                    : 'border-slate-200 dark:border-gray-600 focus:border-slate-900 dark:focus:border-white'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                placeholder="https://api.ejemplo.com"
              />
            </div>
            {errors.url && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.url}
              </p>
            )}
          </div>
        </div>

        {/* Interval & Active Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="checkInterval" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Intervalo de verificación
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                id="checkInterval"
                name="checkInterval"
                value={formData.checkInterval}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all text-sm text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                {intervalOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Estado inicial
            </label>
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
              />
              <span className="text-sm text-slate-700 dark:text-gray-300">
                Iniciar monitoreo automáticamente
              </span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
            Descripción <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none"
              placeholder="Descripción del servicio..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 dark:bg-white dark:hover:bg-gray-100 dark:disabled:bg-gray-700 text-white dark:text-slate-900 font-medium py-2.5 px-5 rounded-lg transition-all text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 dark:border-slate-400/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar servicio</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ServiceForm;
