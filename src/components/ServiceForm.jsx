import { useState } from 'react';
import { Plus, Globe, Clock, FileText, Check, AlertCircle, Server, Shield, Network, Activity } from 'lucide-react';

function ServiceForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'HTTP',
    url: '',
    host: '',
    port: '',
    description: '',
    checkInterval: 60,
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceTypes = [
    { value: 'HTTP', label: 'HTTP', icon: Globe, description: 'Monitorizar endpoint HTTP' },
    { value: 'HTTPS', label: 'HTTPS', icon: Shield, description: 'Monitorizar endpoint HTTPS' },
    { value: 'PING', label: 'Ping', icon: Activity, description: 'Ping a servidor' },
    { value: 'DNS', label: 'DNS', icon: Network, description: 'Resolución DNS' },
    { value: 'TCP', label: 'TCP Port', icon: Server, description: 'Verificar puerto TCP' },
    { value: 'SSL', label: 'SSL Certificate', icon: Shield, description: 'Certificado SSL' }
  ];

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    // Validar según el tipo
    if (formData.type === 'HTTP' || formData.type === 'HTTPS') {
      if (!formData.url.trim()) {
        newErrors.url = 'La URL es requerida';
      } else if (!isValidUrl(formData.url)) {
        newErrors.url = 'La URL no es válida (ej: https://ejemplo.com)';
      }
    } else if (formData.type === 'TCP') {
      if (!formData.host.trim()) {
        newErrors.host = 'El host es requerido';
      }
      if (!formData.port) {
        newErrors.port = 'El puerto es requerido';
      } else if (formData.port < 1 || formData.port > 65535) {
        newErrors.port = 'Puerto inválido (1-65535)';
      }
    } else {
      // PING, DNS, SSL
      if (!formData.host.trim()) {
        newErrors.host = 'El host es requerido';
      }
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
      
      try {
        // Preparar datos según el tipo
        const submitData = {
          name: formData.name,
          type: formData.type,
          checkInterval: formData.checkInterval,
          isActive: formData.isActive,
          description: formData.description
        };
        
        if (formData.type === 'HTTP' || formData.type === 'HTTPS') {
          submitData.url = formData.url;
        } else {
          submitData.url = formData.host;
          submitData.host = formData.host;
          if (formData.type === 'TCP') {
            submitData.port = parseInt(formData.port);
          }
        }
        
        console.log('Enviando datos del formulario:', submitData);
        await onSubmit(submitData);
        
        // Resetear formulario solo si tuvo éxito
        setFormData({ 
          name: '', 
          type: 'HTTP',
          url: '', 
          host: '',
          port: '',
          description: '', 
          checkInterval: 60, 
          isActive: true 
        });
        setErrors({});
      } catch (error) {
        console.error('Error en el envío:', error);
      } finally {
        setIsSubmitting(false);
      }
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

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      url: '',
      host: '',
      port: ''
    }));
    setErrors({});
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

  // Renderizar campo específico según el tipo
  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'HTTP':
      case 'HTTPS':
        return (
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
                placeholder={formData.type === 'HTTPS' ? "https://ejemplo.com" : "http://ejemplo.com"}
              />
            </div>
            {errors.url && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.url}
              </p>
            )}
          </div>
        );
      
      case 'TCP':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="host" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Host *
              </label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  id="host"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-gray-700 border rounded-lg focus:outline-none transition-all text-sm ${
                    errors.host 
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                      : 'border-slate-200 dark:border-gray-600 focus:border-slate-900 dark:focus:border-white'
                  } text-slate-900 dark:text-white placeholder-slate-400`}
                  placeholder="example.com"
                />
              </div>
              {errors.host && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.host}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="port" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Puerto *
              </label>
              <input
                type="number"
                id="port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                min="1"
                max="65535"
                className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-700 border rounded-lg focus:outline-none transition-all text-sm ${
                  errors.port 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                    : 'border-slate-200 dark:border-gray-600 focus:border-slate-900 dark:focus:border-white'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                placeholder="80"
              />
              {errors.port && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.port}
                </p>
              )}
            </div>
          </div>
        );
      
      case 'SSL':
        return (
          <div>
            <label htmlFor="host" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Hostname *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                id="host"
                name="host"
                value={formData.host}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-gray-700 border rounded-lg focus:outline-none transition-all text-sm ${
                  errors.host 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                    : 'border-slate-200 dark:border-gray-600 focus:border-slate-900 dark:focus:border-white'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                placeholder="example.com"
              />
            </div>
            {errors.host && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.host}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              Dominio para verificar certificado SSL y fecha de expiración
            </p>
          </div>
        );
      
      case 'PING':
      case 'DNS':
        return (
          <div>
            <label htmlFor="host" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Host *
            </label>
            <div className="relative">
              {formData.type === 'PING' ? (
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              ) : (
                <Network className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              )}
              <input
                type="text"
                id="host"
                name="host"
                value={formData.host}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-gray-700 border rounded-lg focus:outline-none transition-all text-sm ${
                  errors.host 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                    : 'border-slate-200 dark:border-gray-600 focus:border-slate-900 dark:focus:border-white'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                placeholder={formData.type === 'PING' ? "8.8.8.8 o example.com" : "example.com"}
              />
            </div>
            {errors.host && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.host}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              {formData.type === 'PING' 
                ? 'IP o dominio para hacer ping' 
                : 'Dominio para verificar resolución DNS'}
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

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
        {/* Service Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-2">
            Tipo de monitoreo *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {serviceTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    formData.type === type.value
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-gray-700'
                      : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    formData.type === type.value
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-gray-500'
                  }`} />
                  <span className={`text-xs font-medium ${
                    formData.type === type.value
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-gray-400'
                  }`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
            {serviceTypes.find(t => t.value === formData.type)?.description}
          </p>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
            Nombre *
          </label>
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
          {errors.name && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Type Specific Fields */}
        {renderTypeSpecificFields()}

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
