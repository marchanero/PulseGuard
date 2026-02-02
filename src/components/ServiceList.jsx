import ServiceCard from './ServiceCard';

function ServiceList({ services, onDelete, onCheck, onTogglePublic, onViewDetails, isCompact }) {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-6 border-2 border-dashed border-slate-300 dark:border-gray-600">
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No hay servicios configurados
        </h3>
        <p className="text-slate-500 dark:text-gray-400 text-center max-w-md mb-6">
          Añade tu primer servicio para empezar a monitorizar su estado en tiempo real.
        </p>
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Usa el botón "Añadir Servicio" para comenzar</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${isCompact ? 'gap-3' : 'gap-6'}`}>
      {services.map((service, index) => (
        <div 
          key={service.id} 
          style={{ animationDelay: `${index * 50}ms` }}
          className="animate-fade-in"
        >
          <ServiceCard
            service={service}
            onDelete={onDelete}
            onCheck={onCheck}
            onTogglePublic={onTogglePublic}
            onViewDetails={onViewDetails}
            isCompact={isCompact}
          />
        </div>
      ))}
    </div>
  );
}

export default ServiceList;
