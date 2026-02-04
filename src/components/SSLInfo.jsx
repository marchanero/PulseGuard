import { Shield, ShieldAlert, ShieldCheck, ShieldX, Calendar, Clock, AlertTriangle } from 'lucide-react';

/**
 * SSLInfo - Muestra información del certificado SSL
 */
function SSLInfo({ sslExpiryDate, sslDaysRemaining, variant = 'full' }) {
  if (!sslExpiryDate && sslDaysRemaining === undefined) {
    return null;
  }

  const getSSLStatus = () => {
    if (sslDaysRemaining === undefined || sslDaysRemaining === null) {
      return { status: 'unknown', color: 'slate', icon: Shield };
    }
    if (sslDaysRemaining < 0) {
      return { status: 'expired', color: 'red', icon: ShieldX };
    }
    if (sslDaysRemaining <= 7) {
      return { status: 'critical', color: 'red', icon: ShieldAlert };
    }
    if (sslDaysRemaining <= 30) {
      return { status: 'warning', color: 'amber', icon: ShieldAlert };
    }
    return { status: 'valid', color: 'emerald', icon: ShieldCheck };
  };

  const formatExpiryDate = (date) => {
    if (!date) return 'Desconocido';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const { status, color, icon: StatusIcon } = getSSLStatus();

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: 'text-emerald-500'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      icon: 'text-amber-500'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: 'text-red-500'
    },
    slate: {
      bg: 'bg-slate-50 dark:bg-gray-800',
      border: 'border-slate-200 dark:border-gray-700',
      text: 'text-slate-600 dark:text-gray-400',
      icon: 'text-slate-400'
    }
  };

  const classes = colorClasses[color];

  const getStatusMessage = () => {
    switch (status) {
      case 'expired':
        return `Expiró hace ${Math.abs(sslDaysRemaining)} días`;
      case 'critical':
        return `Expira en ${sslDaysRemaining} días - ¡Renovar urgente!`;
      case 'warning':
        return `Expira en ${sslDaysRemaining} días - Renovar pronto`;
      case 'valid':
        return `Válido por ${sslDaysRemaining} días`;
      default:
        return 'Estado SSL desconocido';
    }
  };

  // Versión compacta para tarjetas
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${classes.bg} ${classes.border} border`}>
        <StatusIcon className={`w-3.5 h-3.5 ${classes.icon}`} />
        <span className={`text-xs font-medium ${classes.text}`}>
          {sslDaysRemaining !== null && sslDaysRemaining !== undefined ? (
            sslDaysRemaining < 0 
              ? 'SSL Expirado'
              : `SSL: ${sslDaysRemaining}d`
          ) : 'SSL'}
        </span>
      </div>
    );
  }

  // Versión badge para lista
  if (variant === 'badge') {
    return (
      <div 
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${classes.bg} ${classes.text}`}
        title={getStatusMessage()}
      >
        <StatusIcon className="w-3 h-3" />
        {sslDaysRemaining !== null && sslDaysRemaining !== undefined && (
          <span>{sslDaysRemaining < 0 ? 'Expirado' : `${sslDaysRemaining}d`}</span>
        )}
      </div>
    );
  }

  // Versión completa para drawer/detalles
  return (
    <div className={`p-4 rounded-xl ${classes.bg} ${classes.border} border`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${classes.bg}`}>
          <StatusIcon className={`w-5 h-5 ${classes.icon}`} />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${classes.text}`}>
            Certificado SSL
          </h4>
          <p className={`text-sm mt-1 ${classes.text}`}>
            {getStatusMessage()}
          </p>
          
          {sslExpiryDate && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Expira: {formatExpiryDate(sslExpiryDate)}</span>
              </div>
              {status === 'critical' || status === 'warning' ? (
                <div className={`flex items-center gap-1.5 ${classes.text}`}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Renovación necesaria</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar visual */}
      {sslDaysRemaining !== null && sslDaysRemaining !== undefined && sslDaysRemaining > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
            <span>Validez restante</span>
            <span>{Math.min(sslDaysRemaining, 365)} / 365 días</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                color === 'emerald' ? 'bg-emerald-500' :
                color === 'amber' ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min((sslDaysRemaining / 365) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SSLBadge - Versión simplificada solo para mostrar en listas
 */
export function SSLBadge({ sslDaysRemaining }) {
  if (sslDaysRemaining === null || sslDaysRemaining === undefined) {
    return null;
  }

  const getColor = () => {
    if (sslDaysRemaining < 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (sslDaysRemaining <= 7) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (sslDaysRemaining <= 30) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getColor()}`}>
      <Shield className="w-3 h-3" />
      {sslDaysRemaining < 0 ? 'Expirado' : `${sslDaysRemaining}d`}
    </span>
  );
}

export default SSLInfo;
