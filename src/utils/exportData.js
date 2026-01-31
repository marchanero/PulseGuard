/**
 * Export services data to different formats
 */

export function exportToJSON(services, filename = 'services-export') {
  const dataStr = JSON.stringify(services, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(services, filename = 'services-export') {
  // CSV Headers
  const headers = [
    'Nombre',
    'URL',
    'Estado',
    'Tiempo de Respuesta (ms)',
    'Uptime (%)',
    'Intervalo (s)',
    'Última Verificación',
    'Creado',
    'Total Logs'
  ];

  // Convert services to CSV rows
  const rows = services.map(service => [
    service.name,
    service.url,
    service.status || 'unknown',
    service.responseTime || '',
    service.uptime !== undefined ? service.uptime.toFixed(2) : '',
    service.checkInterval ? service.checkInterval / 1000 : '',
    service.lastChecked ? new Date(service.lastChecked).toLocaleString('es-ES') : '',
    service.createdAt ? new Date(service.createdAt).toLocaleString('es-ES') : '',
    service.logs ? service.logs.length : 0
  ]);

  // Escape special characters and create CSV content
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateReport(services) {
  const totalServices = services.length;
  const onlineServices = services.filter(s => s.status === 'online').length;
  const offlineServices = services.filter(s => s.status === 'offline').length;
  const degradedServices = services.filter(s => s.status === 'degraded').length;
  const unknownServices = services.filter(s => !s.status || s.status === 'unknown').length;
  
  const avgUptime = services.reduce((sum, s) => sum + (s.uptime || 0), 0) / totalServices;
  const avgResponseTime = services.reduce((sum, s) => sum + (s.responseTime || 0), 0) / totalServices;

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalServices,
      onlineServices,
      offlineServices,
      degradedServices,
      unknownServices,
      avgUptime: avgUptime.toFixed(2),
      avgResponseTime: Math.round(avgResponseTime)
    },
    services: services.map(s => ({
      name: s.name,
      url: s.url,
      status: s.status,
      uptime: s.uptime,
      responseTime: s.responseTime,
      lastChecked: s.lastChecked,
      logsCount: s.logs ? s.logs.length : 0
    }))
  };

  return report;
}

export function exportReport(services, filename = 'services-report') {
  const report = generateReport(services);
  const dataStr = JSON.stringify(report, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
