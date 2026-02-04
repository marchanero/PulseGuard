import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Bell, BellOff, BellRing, Check, X, AlertTriangle, AlertCircle, Info, Volume2, VolumeX } from 'lucide-react';

/**
 * NotificationContext - Sistema de notificaciones push del navegador
 * Inspirado en las notificaciones de Uptime Kuma
 */
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [permission, setPermission] = useState('default');
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('notifications_enabled') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('notification_sound') !== 'false';
  });
  const [notifications, setNotifications] = useState([]);

  // Check permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      setIsEnabled(true);
      localStorage.setItem('notifications_enabled', 'true');
      return true;
    }
    
    return false;
  }, []);

  // Toggle notifications
  const toggleNotifications = useCallback(async () => {
    if (isEnabled) {
      setIsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
    } else {
      if (permission !== 'granted') {
        await requestPermission();
      } else {
        setIsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
      }
    }
  }, [isEnabled, permission, requestPermission]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notification_sound', newValue.toString());
  }, [soundEnabled]);

  // Play notification sound
  const playSound = useCallback((type = 'default') => {
    if (!soundEnabled) return;

    // Create audio context for notification sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different notification types
      switch (type) {
        case 'error':
          oscillator.frequency.value = 400;
          oscillator.type = 'square';
          gainNode.gain.value = 0.1;
          break;
        case 'warning':
          oscillator.frequency.value = 600;
          oscillator.type = 'triangle';
          gainNode.gain.value = 0.1;
          break;
        case 'success':
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.08;
          break;
        default:
          oscillator.frequency.value = 520;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.08;
      }

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      console.warn('No se pudo reproducir el sonido de notificación', e);
    }
  }, [soundEnabled]);

  // Send notification
  const sendNotification = useCallback((title, options = {}) => {
    const { body, icon, type = 'info', tag, data, onClick } = options;

    // Add to internal notifications list
    const id = Date.now();
    const notification = {
      id,
      title,
      body,
      type,
      timestamp: new Date(),
      read: false,
      data
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50

    // Play sound
    if (type === 'error') {
      playSound('error');
    } else if (type === 'warning') {
      playSound('warning');
    } else if (type === 'success') {
      playSound('success');
    } else {
      playSound('default');
    }

    // Send browser notification
    if (isEnabled && permission === 'granted') {
      try {
        const browserNotification = new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          tag: tag || id.toString(),
          badge: '/favicon.ico',
          silent: !soundEnabled,
          requireInteraction: type === 'error'
        });

        if (onClick) {
          browserNotification.onclick = () => {
            window.focus();
            onClick(notification);
            browserNotification.close();
          };
        }

        // Auto close after 5 seconds for non-error notifications
        if (type !== 'error') {
          setTimeout(() => browserNotification.close(), 5000);
        }
      } catch (e) {
        console.warn('Error al enviar notificación', e);
      }
    }

    return notification;
  }, [isEnabled, permission, soundEnabled, playSound]);

  // Service status change notification
  const notifyStatusChange = useCallback((service, previousStatus, newStatus) => {
    let title, body, type;

    if (newStatus === 'offline') {
      title = `🔴 ${service.name} está CAÍDO`;
      body = `El servicio dejó de responder. Anterior: ${previousStatus}`;
      type = 'error';
    } else if (newStatus === 'online' && previousStatus === 'offline') {
      title = `🟢 ${service.name} está RECUPERADO`;
      body = `El servicio volvió a estar online`;
      type = 'success';
    } else if (newStatus === 'degraded' || newStatus === 'timeout') {
      title = `🟡 ${service.name} está DEGRADADO`;
      body = `El servicio presenta problemas de rendimiento`;
      type = 'warning';
    } else {
      return null;
    }

    return sendNotification(title, {
      body,
      type,
      tag: `service-${service.id}`,
      data: { serviceId: service.id, previousStatus, newStatus },
      onClick: () => {
        // Could navigate to service details
        console.log('Notification clicked for service:', service.id);
      }
    });
  }, [sendNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    permission,
    isEnabled,
    soundEnabled,
    notifications,
    unreadCount,
    requestPermission,
    toggleNotifications,
    toggleSound,
    sendNotification,
    notifyStatusChange,
    markAsRead,
    markAllAsRead,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
}

/**
 * NotificationBell - Icono de campana con badge de notificaciones
 */
export function NotificationBell({ onClick }) {
  const { isEnabled, unreadCount } = useNotifications();
  
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
      title={isEnabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
    >
      {isEnabled ? (
        unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-slate-600 dark:text-gray-400 animate-wiggle" />
        ) : (
          <Bell className="w-5 h-5 text-slate-600 dark:text-gray-400" />
        )
      ) : (
        <BellOff className="w-5 h-5 text-slate-400 dark:text-gray-500" />
      )}
      
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

/**
 * NotificationPanel - Panel desplegable de notificaciones
 */
export function NotificationPanel({ isOpen, onClose }) {
  const { 
    isEnabled, 
    soundEnabled,
    notifications, 
    toggleNotifications,
    toggleSound,
    markAsRead, 
    markAllAsRead, 
    clearAll,
    permission
  } = useNotifications();

  if (!isOpen) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <Check className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Ahora mismo';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 z-50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Notificaciones
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Settings */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={toggleNotifications}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${isEnabled 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400'}
              `}
            >
              {isEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {isEnabled ? 'Activadas' : 'Desactivadas'}
            </button>

            <button
              onClick={toggleSound}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${soundEnabled 
                  ? 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400' 
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-500'}
              `}
              title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {permission === 'denied' && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Las notificaciones están bloqueadas en tu navegador
            </p>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-gray-400">
                No hay notificaciones
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-gray-700">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`
                    p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors
                    ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                  `}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${notification.read ? 'text-slate-600 dark:text-gray-400' : 'text-slate-900 dark:text-white'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-gray-600 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-slate-200 dark:border-gray-700 flex justify-between">
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Marcar todo como leído
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * NotificationSettings - Configuración de notificaciones
 */
export function NotificationSettings() {
  const { 
    permission, 
    isEnabled, 
    soundEnabled,
    requestPermission, 
    toggleNotifications,
    toggleSound,
    sendNotification 
  } = useNotifications();

  const handleTestNotification = () => {
    sendNotification('🔔 Notificación de prueba', {
      body: 'Las notificaciones están funcionando correctamente',
      type: 'info'
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900 dark:text-white">
        Notificaciones del navegador
      </h4>

      {/* Permission Status */}
      <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : permission === 'denied' ? (
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-slate-500 dark:text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {permission === 'granted' ? 'Permisos concedidos' : 
                 permission === 'denied' ? 'Permisos bloqueados' : 
                 'Permisos pendientes'}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {permission === 'granted' ? 'Recibirás notificaciones del navegador' : 
                 permission === 'denied' ? 'Desbloquea las notificaciones en la configuración del navegador' : 
                 'Solicita permisos para recibir notificaciones'}
              </p>
            </div>
          </div>

          {permission !== 'granted' && permission !== 'denied' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors"
            >
              Solicitar permiso
            </button>
          )}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 cursor-pointer hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Notificaciones push</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Recibe alertas cuando un servicio cambie de estado</p>
            </div>
          </div>
          <button
            onClick={toggleNotifications}
            disabled={permission === 'denied'}
            className={`
              relative w-11 h-6 rounded-full transition-colors
              ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}
              ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
              ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
            `} />
          </button>
        </label>

        <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 cursor-pointer hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Sonido de notificación</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Reproduce un sonido con cada alerta</p>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`
              relative w-11 h-6 rounded-full transition-colors
              ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}
            `}
          >
            <span className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
              ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}
            `} />
          </button>
        </label>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTestNotification}
        className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-gray-700 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
      >
        Enviar notificación de prueba
      </button>
    </div>
  );
}

export default NotificationProvider;
