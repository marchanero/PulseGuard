import { Plus, Server, ArrowRight } from 'lucide-react';

function EmptyState({ onAddClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Icono */}
      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center mb-6">
        <Server className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </div>
      
      {/* Texto */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
        No hay servicios
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-gray-400 text-center max-w-sm mb-8">
        Añade tu primer servicio para empezar a monitorizar su estado en tiempo real.
      </p>
      
      {/* Botón */}
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Añadir servicio
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default EmptyState;
