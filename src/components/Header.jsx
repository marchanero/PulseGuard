import { Plus, RefreshCw, Search, Command, Minimize2, Maximize2, Activity } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

function Header({ onAddClick, onCheckAll, servicesCount, isCompact, onToggleCompact, onOpenCommandPalette }) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
              <Activity className="w-4 h-4 text-white dark:text-slate-900" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                PulseGuard
              </h1>
            </div>
          </div>

          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="text-slate-400">Buscar...</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
              <Command className="w-3 h-3 inline" />
              K
            </kbd>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            
            {/* Compact Mode Toggle */}
            <button
              onClick={onToggleCompact}
              className={`p-2 rounded-lg transition-colors ${
                isCompact 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isCompact ? 'Modo normal' : 'Modo compacto'}
            >
              {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            
            {servicesCount > 0 && (
              <button
                onClick={onCheckAll}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Verificar todos</span>
              </button>
            )}
            
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
