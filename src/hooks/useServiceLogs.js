import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para cargar logs de un servicio
 * Evita duplicación de lógica de fetch en múltiples componentes
 * 
 * @param {number|string} serviceId - ID del servicio
 * @param {object} options - Opciones de configuración
 * @param {number} options.limit - Límite de logs a cargar
 * @param {number} options.refreshInterval - Intervalo de refresco en ms (0 = sin auto-refresh)
 * @param {boolean} options.enabled - Si el hook está habilitado
 * @returns {object} { logs, loading, error, refresh }
 */
export function useServiceLogs(serviceId, options = {}) {
  const {
    limit = 50,
    refreshInterval = 30000,
    enabled = true
  } = options;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (!serviceId || !enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services/${serviceId}/logs?limit=${limit}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceId, limit, enabled]);

  // Fetch inicial
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0 || !enabled) return;
    
    const interval = setInterval(fetchLogs, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLogs, refreshInterval, enabled]);

  return {
    logs,
    loading,
    error,
    refresh: fetchLogs
  };
}

/**
 * Hook para cargar métricas de un servicio
 * @param {number|string} serviceId - ID del servicio
 * @param {string} period - Período de tiempo (24h, 7d, 30d)
 */
export function useServiceMetrics(serviceId, period = '24h') {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!serviceId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/services/${serviceId}/metrics?period=${period}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceId, period]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics
  };
}

export default useServiceLogs;
