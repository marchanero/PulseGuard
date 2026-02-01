import { useMemo } from 'react';
import { Activity, CheckCircle2, XCircle, AlertTriangle, Clock, Zap, Server, TrendingUp, Percent } from 'lucide-react';

// Stat Card minimalista
const StatCard = ({ title, value, subtitle, icon: IconComponent, color = 'blue' }) => {
  const colorClasses = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    slate: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {IconComponent && <IconComponent className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-gray-400 uppercase font-medium">{title}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-[10px] text-slate-400 dark:text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

// Mini barra de progreso
const MiniStatusBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colorClasses = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400'
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600 dark:text-gray-400">{label}</span>
          <span className="text-slate-500 dark:text-gray-500 font-medium">{count}</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-slate-400 dark:text-gray-500 w-10 text-right">{percentage.toFixed(0)}%</span>
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
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total"
          value={stats.total}
          subtitle={`${stats.online} online`}
          icon={Server}
          color="blue"
        />

        <StatCard
          title="Online"
          value={stats.online}
          subtitle={`${((stats.online / stats.total) * 100).toFixed(0)}%`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Offline"
          value={stats.offline}
          subtitle={stats.offline > 0 ? 'Requiere atención' : 'Todo bien'}
          icon={XCircle}
          color="red"
        />

        <StatCard
          title="Degradado"
          value={stats.degraded}
          subtitle={stats.degraded > 0 ? 'Problemas menores' : 'OK'}
          icon={AlertTriangle}
          color="amber"
        />

        <StatCard
          title="Tiempo Medio"
          value={`${Math.round(stats.avgResponseTime)}ms`}
          subtitle="Respuesta"
          icon={Zap}
          color="purple"
        />

        <StatCard
          title="Uptime"
          value={`${stats.avgUptime.toFixed(1)}%`}
          subtitle="Disponibilidad"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Distribution Bars - Compact */}
      {services.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Distribución de servicios
            </h3>
            <span className="text-xs text-slate-500 dark:text-gray-400">{stats.total} total</span>
          </div>
          
          <div className="space-y-3">
            <MiniStatusBar 
              label="Online" 
              count={stats.online} 
              total={stats.total} 
              color="emerald" 
            />
            <MiniStatusBar 
              label="Offline" 
              count={stats.offline} 
              total={stats.total} 
              color="red" 
            />
            <MiniStatusBar 
              label="Degradado" 
              count={stats.degraded} 
              total={stats.total} 
              color="amber" 
            />
            <MiniStatusBar 
              label="Desconocido" 
              count={stats.unknown} 
              total={stats.total} 
              color="slate" 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardStats;
