import ThemeToggle from './ThemeToggle';
import { Button } from './ui';
import { Search, Command, Minimize2, Maximize2 } from 'lucide-react';

function Header({ onAddClick, onCheckAll, servicesCount, isCompact, onToggleCompact, onOpenCommandPalette }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-gray-800">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                ServiceMonitor
              </h1>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {servicesCount} {servicesCount === 1 ? 'servicio' : 'servicios'} activos
              </p>
            </div>
          </div>

          {/* Command Palette Trigger - Desktop */}
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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {/* Compact Mode Toggle */}
            <button
              onClick={onToggleCompact}
              className={`p-2 rounded-lg transition-colors ${
                isCompact 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isCompact ? 'Modo normal' : 'Modo compacto'}
            >
              {isCompact ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </button>
            
            {servicesCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCheckAll}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
                className="hidden sm:inline-flex"
              >
                Verificar todos
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={onAddClick}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              <span className="hidden sm:inline">Añadir servicio</span>
              <span className="sm:hidden">Añadir</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
