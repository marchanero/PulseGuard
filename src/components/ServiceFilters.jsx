import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, LayoutGrid, List, ArrowUpDown, X, Tag } from 'lucide-react';
import ExportButton from './ExportButton';
import { TagFilter } from './ServiceTags';

function ServiceFilters({ services, onFilterChange, viewMode, onViewModeChange, isOpen, isCompact }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(isOpen || false);

  // Asegurar que services sea siempre un array
  const safeServices = Array.isArray(services) ? services : [];

  // Extraer todos los tags únicos de los servicios
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    safeServices.forEach(service => {
      if (service.tags && Array.isArray(service.tags)) {
        service.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [safeServices]);

  const statusOptions = [
    { value: 'all', label: 'Todos', count: safeServices.length, color: 'bg-slate-500' },
    { value: 'online', label: 'Online', count: safeServices.filter(s => s.status === 'online').length, color: 'bg-emerald-500' },
    { value: 'offline', label: 'Offline', count: safeServices.filter(s => s.status === 'offline').length, color: 'bg-red-500' },
    { value: 'degraded', label: 'Degradado', count: safeServices.filter(s => s.status === 'degraded').length, color: 'bg-amber-500' },
    { value: 'timeout', label: 'Timeout', count: safeServices.filter(s => s.status === 'timeout').length, color: 'bg-orange-500' },
    { value: 'unknown', label: 'Desconocido', count: safeServices.filter(s => !s.status || s.status === 'unknown').length, color: 'bg-slate-400' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Nombre' },
    { value: 'status', label: 'Estado' },
    { value: 'responseTime', label: 'Tiempo resp.' },
    { value: 'uptime', label: 'Uptime' },
    { value: 'lastChecked', label: 'Último check' }
  ];

  const filteredServices = useMemo(() => {
    const servicesArray = Array.isArray(services) ? services : [];
    let result = [...servicesArray];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(service =>
        service.name?.toLowerCase().includes(query) ||
        service.url?.toLowerCase().includes(query) ||
        // También buscar en tags
        (service.tags && service.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(service => service.status === statusFilter);
    }

    // Filtrar por tags seleccionados
    if (selectedTags.length > 0) {
      result = result.filter(service => 
        service.tags && selectedTags.every(tag => service.tags.includes(tag))
      );
    }

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
  }, [services, searchQuery, statusFilter, selectedTags, sortBy]);

  useEffect(() => {
    onFilterChange(filteredServices);
  }, [filteredServices, onFilterChange]);

  const activeFiltersCount = (searchQuery ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (selectedTags.length > 0 ? 1 : 0);
  const showFiltersPanel = isOpen !== undefined ? isOpen : showFilters;

  if (isCompact) {
    return (
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 space-y-3">
      {/* Barra principal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3">
        <div className="flex items-center gap-2">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botón filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-white/20 dark:bg-slate-900/20 text-xs rounded-full min-w-[1.25rem] text-center">
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
                  ? 'bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
              }`}
              title="Vista de cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
              }`}
              title="Vista de lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Exportar */}
          <div className="hidden md:block">
            <ExportButton services={services} />
          </div>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFiltersPanel && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Filtros de estado */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-2">
                Estado
              </label>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === option.value
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${option.color}`} />
                    <span>{option.label}</span>
                    <span className={`text-[10px] ${
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
              <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-2">
                Ordenar por
              </label>
              <div className="flex flex-wrap gap-1.5">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === option.value
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtro por Tags */}
          {allTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700">
              <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-2">
                Etiquetas
              </label>
              <TagFilter 
                allTags={allTags} 
                selectedTags={selectedTags} 
                onChange={setSelectedTags} 
              />
            </div>
          )}

          {/* Resultados */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-700">
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Mostrando <span className="font-medium text-slate-900 dark:text-white">{filteredServices.length}</span> de <span className="font-medium text-slate-900 dark:text-white">{safeServices.length}</span> servicios
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceFilters;
