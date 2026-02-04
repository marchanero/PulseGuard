import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getColorClass(uptime) {
  if (uptime >= 99) return 'bg-green-500';
  if (uptime >= 95) return 'bg-green-400';
  if (uptime >= 90) return 'bg-yellow-400';
  if (uptime >= 80) return 'bg-orange-400';
  return 'bg-red-500';
}

function getTooltipText(day) {
  const date = new Date(day.date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `${date}: ${day.uptime.toFixed(2)}% uptime`;
}

export function UptimeHeatmap({ serviceId, days = 90 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(days);

  useEffect(() => {
    fetchHeatmapData();
  }, [serviceId, selectedDays]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(
        `${API_URL}/analytics/heatmap/${serviceId}?days=${selectedDays}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Error al cargar datos');
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 84 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-200 dark:bg-gray-700 rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  // Organizar datos en semanas
  const weeks = [];
  let currentWeek = [];
  
  data.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Disponibilidad (últimos {selectedDays} días)
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDays(30)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedDays === 30
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
            }`}
          >
            30 días
          </button>
          <button
            onClick={() => setSelectedDays(60)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedDays === 60
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
            }`}
          >
            60 días
          </button>
          <button
            onClick={() => setSelectedDays(90)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedDays === 90
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
            }`}
          >
            90 días
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2">
          {dayNames.map((day) => (
            <div key={day} className="h-4 text-xs text-slate-500 dark:text-gray-400 flex items-center">
              {day}
            </div>
          ))}
        </div>
        
        {/* Weeks */}
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-4 h-4 rounded-sm ${getColorClass(day.uptime)} hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 dark:hover:ring-gray-500 cursor-pointer transition-all`}
                  title={getTooltipText(day)}
                />
              ))}
              {week.length < 7 && 
                Array.from({ length: 7 - week.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-4 h-4" />
                ))
              }
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <span className="text-slate-600 dark:text-gray-400">Menos</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-red-500 rounded-sm" title="< 80%" />
          <div className="w-4 h-4 bg-orange-400 rounded-sm" title="80-90%" />
          <div className="w-4 h-4 bg-yellow-400 rounded-sm" title="90-95%" />
          <div className="w-4 h-4 bg-green-400 rounded-sm" title="95-99%" />
          <div className="w-4 h-4 bg-green-500 rounded-sm" title="≥ 99%" />
        </div>
        <span className="text-slate-600 dark:text-gray-400">Más</span>
      </div>
    </div>
  );
}