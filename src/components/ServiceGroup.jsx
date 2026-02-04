import { useState, useMemo } from 'react';
import { FolderOpen, ChevronDown, ChevronRight, Plus, Edit2, Trash2, MoreVertical, FolderPlus } from 'lucide-react';

/**
 * ServiceGroup - Componente para agrupar servicios
 * Inspirado en Uptime Kuma's service groups
 */
function ServiceGroup({ 
  group, 
  services = [], 
  isExpanded = true,
  onToggle,
  onEdit,
  onDelete,
  children 
}) {
  const [showMenu, setShowMenu] = useState(false);

  // Calcular estadísticas del grupo
  const stats = useMemo(() => {
    const total = services.length;
    const online = services.filter(s => s.status === 'online').length;
    const offline = services.filter(s => s.status === 'offline').length;
    const degraded = services.filter(s => s.status === 'degraded' || s.status === 'timeout').length;
    
    let overallStatus = 'online';
    if (offline > 0) overallStatus = 'offline';
    else if (degraded > 0) overallStatus = 'degraded';
    else if (total === 0) overallStatus = 'empty';
    
    return { total, online, offline, degraded, overallStatus };
  }, [services]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'degraded': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'online': return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'offline': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'degraded': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default: return 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700';
    }
  };

  return (
    <div className="mb-4">
      {/* Group Header */}
      <div 
        className={`
          flex items-center justify-between p-3 rounded-xl border cursor-pointer
          transition-all duration-200 hover:shadow-sm
          ${getStatusBg(stats.overallStatus)}
        `}
        onClick={() => onToggle?.()}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Icon */}
          <button className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500 dark:text-gray-400" />
            )}
          </button>

          {/* Group Icon with Status */}
          <div className="relative">
            <div className={`w-9 h-9 rounded-lg ${getStatusBg(stats.overallStatus)} flex items-center justify-center`}>
              <FolderOpen className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(stats.overallStatus)}`} />
          </div>

          {/* Group Name */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {group.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {/* Service Count Stats */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {stats.online}
            </span>
            {stats.offline > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {stats.offline}
              </span>
            )}
            {stats.degraded > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {stats.degraded}
              </span>
            )}
            <span className="text-slate-400 dark:text-gray-500">
              / {stats.total}
            </span>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => { onEdit?.(group); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar grupo
                  </button>
                  <button
                    onClick={() => { onDelete?.(group); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar grupo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Group Content */}
      {isExpanded && (
        <div className="mt-2 pl-6 border-l-2 border-slate-200 dark:border-gray-700 ml-5">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * GroupManager - Gestionar grupos de servicios
 */
export function GroupManager({ groups = [], onAdd, onEdit, onDelete }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  const handleAdd = () => {
    if (newGroup.name.trim()) {
      onAdd?.(newGroup);
      setNewGroup({ name: '', description: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Add Group Button */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          Crear nuevo grupo
        </button>
      ) : (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">
              Nombre del grupo
            </label>
            <input
              type="text"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              placeholder="Ej: Producción, APIs, Bases de datos..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              placeholder="Descripción del grupo..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setNewGroup({ name: '', description: '' }); }}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!newGroup.name.trim()}
              className="px-3 py-1.5 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Crear grupo
            </button>
          </div>
        </div>
      )}

      {/* Existing Groups */}
      {groups.map((group) => (
        <div
          key={group.id}
          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{group.name}</p>
              {group.description && (
                <p className="text-xs text-slate-500 dark:text-gray-400">{group.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit?.(group)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(group)}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * GroupSelector - Selector de grupo para el formulario de servicio
 */
export function GroupSelector({ groups = [], value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
        Grupo (opcional)
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value || null)}
        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
      >
        <option value="">Sin grupo</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ServiceGroup;
