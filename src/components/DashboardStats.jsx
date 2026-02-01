import { useMemo } from 'react';
import { Card } from './ui';

// Componente StatCard separado para evitar error de ESLint
const StatCard = ({ title, value, subtitle, icon, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
  };

  return (
    <Card className="relative overflow-hidden group py-4 px-4" hover>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
              trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-slate-400 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

// Barra de progreso para distribución
const StatusBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colorClasses = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400'
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-gray-400">{label}</span>
        <span className="text-slate-500 dark:text-gray-500">
          {count} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

function DashboardStats({ services, isCompact }) {
  const stats = useMemo(() => {
    const total = services.length;
    const online = services.filter(s => s.status === 'online').length;
    const offline = services.filter(s => s.status === 'offline' || s.status === 'timeout').length;
    const unknown = services.filter(s => s.status === 'unknown' || !s.status).length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    
    const avgResponseTime = services
      .filter(s => s.responseTime)
      .reduce((acc, s) => acc + s.responseTime, 0) / services.filter(s => s.responseTime).length || 0;
    
    // Calcular uptime global basado en servicios que tienen datos de monitoreo
    const servicesWithUptime = services.filter(s => s.totalMonitoredTime > 0);
    const avgUptime = servicesWithUptime.length > 0 
      ? servicesWithUptime.reduce((acc, s) => acc + (s.uptime || 0), 0) / servicesWithUptime.length 
      : (online / total) * 100; // Fallback: porcentaje de servicios online

    return {
      total,
      online,
      offline,
      unknown,
      degraded,
      avgResponseTime,
      avgUptime
    };
  }, [services]);

  if (isCompact) {
    // Compact mode - minimal stats
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
          <div className="text-xs text-slate-500 dark:text-gray-400 uppercase">Total</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase">Online</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.online}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
          <div className="text-xs text-slate-500 dark:text-gray-400 uppercase">Tiempo Medio</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(stats.avgResponseTime)}<span className="text-sm">ms</span></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
          <div className="text-xs text-slate-500 dark:text-gray-400 uppercase">Uptime</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgUptime.toFixed(0)}<span className="text-sm">%</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Servicios"
          value={stats.total}
          subtitle={`${stats.online} activos`}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <StatCard
          title="Online"
          value={stats.online}
          subtitle={`${((stats.online / stats.total) * 100).toFixed(0)}% del total`}
          color="emerald"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Tiempo Medio"
          value={`${Math.round(stats.avgResponseTime)}ms`}
          subtitle="Tiempo de respuesta"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <StatCard
          title="Uptime Global"
          value={`${stats.avgUptime.toFixed(1)}%`}
          subtitle="Promedio de disponibilidad"
          color="amber"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Distribution Bars - Compact */}
      {services.length > 0 && (
        <Card className="py-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Distribución
            </h3>
            <span className="text-xs text-slate-500 dark:text-gray-400">{stats.total} servicios</span>
          </div>
          
          <div className="space-y-2">
            <StatusBar 
              label="Online" 
              count={stats.online} 
              total={stats.total} 
              color="emerald" 
            />
            <StatusBar 
              label="Offline" 
              count={stats.offline} 
              total={stats.total} 
              color="red" 
            />
            <StatusBar 
              label="Degradado" 
              count={stats.degraded} 
              total={stats.total} 
              color="amber" 
            />
          </div>
        </Card>
      )}
    </div>
  );
}

export default DashboardStats;
