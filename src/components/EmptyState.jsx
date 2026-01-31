import { Button } from './ui';

function EmptyState({ onAddClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="relative w-32 h-32 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-slate-300 dark:border-gray-600 flex items-center justify-center shadow-xl">
          <svg className="w-16 h-16 text-slate-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
        No hay servicios configurados
      </h3>
      
      <p className="text-slate-500 dark:text-gray-400 text-center max-w-md mb-8 leading-relaxed">
        Comienza añadiendo tu primer servicio para monitorizar su estado en tiempo real. 
        Recibirás notificaciones cuando haya cambios importantes.
      </p>
      
      <Button
        onClick={onAddClick}
        size="lg"
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      >
        Añadir primer servicio
      </Button>
    </div>
  );
}

export default EmptyState;
