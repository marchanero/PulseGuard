import { useState, useMemo } from 'react';
import ExportButton from './ExportButton';

function ServiceFilters({ services, onFilterChange, viewMode, onViewModeChange, isOpen, isCompact }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(isOpen || false);

  // Asegurar que services sea siempre un array
  const safeServices = Array.isArray(services) ? services : [];

  const statusOptions = [
    { value: 'all', label: 'Todos', count: safeServices.length, color: 'bg-slate-500' },
    { value: 'online', label: 'Online', count: safeServices.filter(s => s.status === 'online').length, color: 'bg-emerald-500' },
    { value: 'offline', label: 'Offline', count: safeServices.filter(s => s.status === 'offline').length, color: 'bg-red-500' },
    { value: 'degraded', label: 'Degradado', count: safeServices.filter(s => s.status === 'degraded').length, color: 'bg-amber-500' },
    { value: 'timeout', label: 'Timeout', count: safeServices.filter(s => s.status === 'timeout').length, color: 'bg-orange-500' },
    { value: 'unknown', label: 'Desconocido', count: safeServices.filter(s => !s.status || s.status === 'unknown').length, color: 'bg-slate-400' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Nombre', icon: 'Aa' },
    { value: 'status', label: 'Estado', icon: '●' },
    { value: 'responseTime', label: 'Tiempo de respuesta', icon: '⚡' },
    { value: 'uptime', label: 'Uptime', icon: '%' },
    { value: 'lastChecked', label: 'Última verificación', icon: '🕐' }
  ];

  const filteredServices = useMemo(() => {
    // Ensure services is an array
    const servicesArray = Array.isArray(services) ? services : [];
    let result = [...servicesArray];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(service =>
        service.name?.toLowerCase().includes(query) ||
        service.url?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(service => service.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status': {
          const statusOrder = { online: 0, degraded: 1, timeout: 2, offline: 3, unknown: 4 };
          return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
        }
        case 'responseTime':
          return (a.responseTime || 0) - (b.responseTime || 0);
        case 'uptime':
          return (b.uptime || 0) - (a.uptime || 0);
        case 'lastChecked':
          return new Date(b.lastChecked || 0) - new Date(a.lastChecked || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [services, searchQuery, statusFilter, sortBy]);

  // Notify parent of filtered results
  useMemo(() => {
    onFilterChange(filteredServices);
  }, [filteredServices, onFilterChange]);

  const activeFiltersCount = (searchQuery ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  // Remove the useEffect and use isOpen directly when provided
  const showFiltersPanel = isOpen !== undefined ? isOpen : showFilters;

  if (isCompact) {
    // Compact mode - minimal filters
    return (
      <div className={`mb-4 ${isCompact ? 'space-y-2' : 'space-y-3'}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Barra principal compacta */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3">
        <div className="flex items-center gap-2">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Botón filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full min-w-[1.25rem] text-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Vista Grid/List */}
          <div className="flex items-center bg-slate-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
              }`}
              title="Vista de cuadrícula"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
              }`}
              title="Vista de lista"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Exportar - solo desktop */}
          <div className="hidden md:block">
            <ExportButton services={services} />
          </div>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFiltersPanel && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Filtros de estado */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Filtrar por estado
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      statusFilter === option.value
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md'
                        : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${option.color}`} />
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.label.slice(0, 3)}</span>
                    <span className={`text-xs ${
                      statusFilter === option.value
                        ? 'text-slate-300 dark:text-slate-500'
                        : 'text-slate-400 dark:text-gray-500'
                    }`}>
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Ordenar por
              </label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sortBy === option.value
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSortBy('name');
                }}
                className="text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resultados count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-gray-400">
          {filteredServices.length === 0 ? (
            'No se encontraron servicios'
          ) : (
            <>
              Mostrando <span className="font-medium text-slate-700 dark:text-gray-200">{filteredServices.length}</span> de{' '}
              <span className="font-medium text-slate-700 dark:text-gray-200">{services.length}</span> servicios
            </>
          )}
        </span>
        
        {filteredServices.length > 0 && (
          <span className="text-slate-400 dark:text-gray-500 text-xs">
            {viewMode === 'grid' ? 'Vista de cuadrícula' : 'Vista de lista'}
          </span>
        )}
      </div>
    </div>
  );
}

export default ServiceFilters;
