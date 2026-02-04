import { useState, useMemo } from 'react';
import { 
  Wrench, 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  CalendarRange
} from 'lucide-react';

/**
 * MaintenanceWindow - Componente para programar ventanas de mantenimiento
 * Inspirado en Uptime Kuma's maintenance mode
 */

// Badge que muestra el estado de mantenimiento
export function MaintenanceBadge({ maintenance, size = 'normal' }) {
  if (!maintenance) return null;

  const isActive = isMaintenanceActive(maintenance);
  const isScheduled = !isActive && new Date(maintenance.startTime) > new Date();

  const sizeClasses = {
    small: 'px-1.5 py-0.5 text-[10px] gap-1',
    normal: 'px-2 py-1 text-xs gap-1.5',
    large: 'px-3 py-1.5 text-sm gap-2'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    normal: 'w-3.5 h-3.5',
    large: 'w-4 h-4'
  };

  if (isActive) {
    return (
      <span className={`
        inline-flex items-center font-medium rounded-full
        bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
        border border-amber-200 dark:border-amber-800
        ${sizeClasses[size]}
      `}>
        <Wrench className={`${iconSizes[size]} animate-pulse`} />
        En mantenimiento
      </span>
    );
  }

  if (isScheduled) {
    return (
      <span className={`
        inline-flex items-center font-medium rounded-full
        bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400
        border border-blue-200 dark:border-blue-800
        ${sizeClasses[size]}
      `}>
        <Calendar className={iconSizes[size]} />
        Mantenimiento programado
      </span>
    );
  }

  return null;
}

// Helper para verificar si un mantenimiento está activo
export function isMaintenanceActive(maintenance) {
  if (!maintenance) return false;
  
  const now = new Date();
  const start = new Date(maintenance.startTime);
  const end = new Date(maintenance.endTime);
  
  return now >= start && now <= end;
}

// Helper para obtener próximo mantenimiento
export function getNextMaintenance(maintenances = []) {
  const now = new Date();
  
  // Primero buscar mantenimiento activo
  const active = maintenances.find(m => isMaintenanceActive(m));
  if (active) return { ...active, isActive: true };
  
  // Luego buscar el próximo programado
  const upcoming = maintenances
    .filter(m => new Date(m.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  
  return upcoming[0] ? { ...upcoming[0], isActive: false } : null;
}

/**
 * MaintenanceScheduler - Formulario para programar mantenimientos
 */
export function MaintenanceScheduler({ serviceId, onSchedule, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    recurring: false,
    recurringPattern: 'weekly' // weekly, monthly
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) return;
    
    onSchedule?.({
      ...formData,
      serviceId,
      id: Date.now(),
      createdAt: new Date().toISOString()
    });
  };

  // Set default dates to today
  useState(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    setFormData(prev => ({
      ...prev,
      startTime: start.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16)
    }));
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
          Título del mantenimiento *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ej: Actualización de servidor"
          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
          Descripción (opcional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe el mantenimiento..."
          rows={3}
          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white resize-none"
        />
      </div>

      {/* Date/Time Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
            Inicio *
          </label>
          <input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
            Fin *
          </label>
          <input
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            min={formData.startTime}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
            required
          />
        </div>
      </div>

      {/* Recurring */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Mantenimiento recurrente
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Repetir automáticamente
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, recurring: !formData.recurring })}
          className={`
            relative w-11 h-6 rounded-full transition-colors
            ${formData.recurring ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}
          `}
        >
          <span className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
            ${formData.recurring ? 'translate-x-5' : 'translate-x-0'}
          `} />
        </button>
      </div>

      {/* Recurring Pattern */}
      {formData.recurring && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
            Patrón de repetición
          </label>
          <select
            value={formData.recurringPattern}
            onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
          >
            <option value="daily">Diariamente</option>
            <option value="weekly">Semanalmente</option>
            <option value="biweekly">Cada 2 semanas</option>
            <option value="monthly">Mensualmente</option>
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-gray-700 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors"
        >
          Programar mantenimiento
        </button>
      </div>
    </form>
  );
}

/**
 * MaintenanceList - Lista de mantenimientos programados
 */
export function MaintenanceList({ 
  maintenances = [], 
  onEdit, 
  onDelete,
  onToggleActive 
}) {
  const { active, upcoming, past } = useMemo(() => {
    const now = new Date();
    
    return maintenances.reduce((acc, m) => {
      if (isMaintenanceActive(m)) {
        acc.active.push(m);
      } else if (new Date(m.startTime) > now) {
        acc.upcoming.push(m);
      } else {
        acc.past.push(m);
      }
      return acc;
    }, { active: [], upcoming: [], past: [] });
  }, [maintenances]);

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const MaintenanceItem = ({ maintenance, status }) => (
    <div className={`
      p-4 rounded-xl border transition-all
      ${status === 'active' 
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
        : status === 'upcoming'
        ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
        : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 opacity-60'}
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
            ${status === 'active' 
              ? 'bg-amber-100 dark:bg-amber-900/30' 
              : status === 'upcoming'
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-slate-100 dark:bg-gray-700'}
          `}>
            <Wrench className={`w-5 h-5 ${
              status === 'active' 
                ? 'text-amber-600 dark:text-amber-400 animate-pulse' 
                : status === 'upcoming'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400'
            }`} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {maintenance.title}
            </h4>
            {maintenance.description && (
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                {maintenance.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateTime(maintenance.startTime)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(maintenance.startTime, maintenance.endTime)}
              </span>
              {maintenance.recurring && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Recurrente
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {status === 'active' && onToggleActive && (
            <button
              onClick={() => onToggleActive(maintenance)}
              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
              title="Finalizar mantenimiento"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {status === 'upcoming' && (
            <>
              <button
                onClick={() => onEdit?.(maintenance)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(maintenance)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar for active maintenance */}
      {status === 'active' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 mb-1">
            <span>En progreso</span>
            <span>{formatDateTime(maintenance.endTime)}</span>
          </div>
          <div className="h-1.5 bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, Math.max(0, 
                  ((Date.now() - new Date(maintenance.startTime)) / 
                   (new Date(maintenance.endTime) - new Date(maintenance.startTime))) * 100
                ))}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (maintenances.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <CalendarRange className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-gray-400">
          No hay mantenimientos programados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Maintenance */}
      {active.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            MANTENIMIENTO ACTIVO
          </h5>
          <div className="space-y-2">
            {active.map(m => (
              <MaintenanceItem key={m.id} maintenance={m} status="active" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Maintenance */}
      {upcoming.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
            PROGRAMADOS ({upcoming.length})
          </h5>
          <div className="space-y-2">
            {upcoming.map(m => (
              <MaintenanceItem key={m.id} maintenance={m} status="upcoming" />
            ))}
          </div>
        </div>
      )}

      {/* Past Maintenance */}
      {past.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-slate-400 dark:text-gray-500 mb-2">
            HISTORIAL ({past.length})
          </h5>
          <div className="space-y-2">
            {past.slice(0, 5).map(m => (
              <MaintenanceItem key={m.id} maintenance={m} status="past" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MaintenancePanel - Panel completo de mantenimientos
 */
export function MaintenancePanel({ serviceId, maintenances = [], onAdd, onEdit, onDelete }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleSchedule = (maintenance) => {
    onAdd?.(maintenance);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Ventanas de mantenimiento
          </h3>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Programar
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
          <MaintenanceScheduler
            serviceId={serviceId}
            onSchedule={handleSchedule}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {/* Maintenance List */}
      <MaintenanceList
        maintenances={maintenances}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          💡 Durante el mantenimiento, el servicio no generará alertas ni afectará las estadísticas de uptime.
        </p>
      </div>
    </div>
  );
}

export default MaintenancePanel;
