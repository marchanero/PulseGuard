import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Server, Plus, LayoutGrid, List, Filter, RefreshCw, Moon, Sun, Keyboard, X } from 'lucide-react';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  services, 
  onSelectService, 
  onAddService, 
  onToggleView,
  onToggleFilters,
  onRefresh,
  viewMode,
  showFilters,
  theme,
  onToggleTheme
}) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        document.addEventListener('keydown', handleEscape);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleEscape]);

  // Filter services
  const filteredServices = useMemo(() => {
    if (!search.trim()) return [];
    return services.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.url.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);
  }, [services, search]);

  // Static actions
  const actions = useMemo(() => [
    { id: 'add', label: 'Añadir nuevo servicio', icon: Plus, shortcut: 'Ctrl+N', action: onAddService },
    { id: 'view', label: `Cambiar a vista ${viewMode === 'grid' ? 'lista' : 'grid'}`, icon: viewMode === 'grid' ? List : LayoutGrid, shortcut: 'G', action: onToggleView },
    { id: 'filters', label: `${showFilters ? 'Ocultar' : 'Mostrar'} filtros`, icon: Filter, shortcut: 'F', action: onToggleFilters },
    { id: 'refresh', label: 'Refrescar datos', icon: RefreshCw, shortcut: 'R', action: onRefresh },
    { id: 'theme', label: `Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`, icon: theme === 'dark' ? Sun : Moon, shortcut: 'T', action: onToggleTheme },
    { id: 'shortcuts', label: 'Ver atajos de teclado', icon: Keyboard, shortcut: '?', action: () => {} },
  ], [viewMode, showFilters, theme, onAddService, onToggleView, onToggleFilters, onRefresh, onToggleTheme]);

  // Combine results
  const allItems = useMemo(() => {
    const items = [];
    if (filteredServices.length > 0) {
      items.push({ type: 'header', label: 'Servicios' });
      items.push(...filteredServices.map(s => ({ type: 'service', data: s })));
    }
    items.push({ type: 'header', label: 'Acciones' });
    items.push(...actions.map(a => ({ type: 'action', data: a })));
    return items;
  }, [filteredServices, actions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.filter(i => i.type !== 'header').length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.filter(i => i.type !== 'header').length) % allItems.filter(i => i.type !== 'header').length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectableItems = allItems.filter(i => i.type !== 'header');
        const selected = selectableItems[selectedIndex];
        if (selected) {
          if (selected.type === 'service') {
            onSelectService(selected.data);
            onClose();
          } else if (selected.type === 'action') {
            selected.data.action();
            if (selected.data.id !== 'shortcuts') {
              onClose();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onSelectService, onClose]);

  if (!isOpen) return null;

  let selectableIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar servicios o acciones..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none text-lg"
          />
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {allItems.map((item, index) => {
            if (item.type === 'header') {
              return (
                <div key={`header-${index}`} className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {item.label}
                </div>
              );
            }

            selectableIndex++;
            const isSelected = selectableIndex === selectedIndex;
            const actualIndex = selectableIndex;

            if (item.type === 'service') {
              const service = item.data;
              return (
                <button
                  key={service.id}
                  onClick={() => {
                    onSelectService(service);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(actualIndex)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    service.status === 'online' ? 'bg-emerald-500' :
                    service.status === 'offline' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <Server className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {service.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {service.url}
                    </div>
                  </div>
                </button>
              );
            }

            if (item.type === 'action') {
              const action = item.data;
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.action();
                    if (action.id !== 'shortcuts') {
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(actualIndex)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                    {action.label}
                  </span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded">
                    {action.shortcut}
                  </kbd>
                </button>
              );
            }

            return null;
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded">↑↓</kbd>
              <span>navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded">↵</kbd>
              <span>seleccionar</span>
            </span>
          </div>
          <span>{allItems.filter(i => i.type !== 'header').length} resultados</span>
        </div>
      </div>
    </div>
  );
}
