import { useState } from 'react';

function OnboardingGuide({ isOpen, onClose, servicesCount }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Check localStorage directly - returns null if not set
  const hasSeenGuide = localStorage.getItem('serviceMonitor_onboardingSeen') !== null;

  // Mark guide as seen
  const markAsSeen = () => {
    localStorage.setItem('serviceMonitor_onboardingSeen', 'true');
  };

  const steps = [
    {
      title: '¡Bienvenido a ServiceMonitor!',
      description: 'Tu herramienta profesional para monitorizar servicios web en tiempo real. Te guiaremos por las funcionalidades principales.',
      icon: (
        <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-blue-500'
    },
    {
      title: 'Añade tus servicios',
      description: 'Haz clic en "Añadir Servicio" para comenzar a monitorizar URLs. Puedes configurar el intervalo de verificación desde 10 segundos hasta 1 hora.',
      icon: (
        <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'bg-emerald-500'
    },
    {
      title: 'Monitoreo automático',
      description: 'El sistema verificará automáticamente el estado de tus servicios según el intervalo configurado. Recibirás notificaciones visuales de cualquier cambio.',
      icon: (
        <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      color: 'bg-purple-500'
    },
    {
      title: 'Visualiza estadísticas',
      description: 'Cada servicio muestra gráficos de tiempo de respuesta, uptime y un historial completo de verificaciones. Usa los filtros para organizar tus servicios.',
      icon: (
        <svg className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-amber-500'
    },
    {
      title: 'Exporta tus datos',
      description: 'Puedes exportar todos tus servicios en formato JSON o CSV, o generar informes completos con estadísticas para análisis externos.',
      icon: (
        <svg className="w-16 h-16 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      color: 'bg-rose-500'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      markAsSeen();
      onClose();
    }
  };

  const handleSkip = () => {
    markAsSeen();
    onClose();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Don't show if already seen or no services yet (except first step)
  if (!isOpen || (hasSeenGuide && servicesCount > 0)) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    index === currentStep
                      ? 'bg-blue-500 w-6'
                      : index < currentStep
                      ? 'bg-blue-300 dark:bg-blue-700'
                      : 'bg-slate-200 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-24 h-24 rounded-2xl ${step.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center`}>
              {step.icon}
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              {step.title}
            </h2>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors"
            >
              Omitir tour
            </button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Anterior
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
              >
                {currentStep === steps.length - 1 ? '¡Empezar!' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
}

export default OnboardingGuide;
