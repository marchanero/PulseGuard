# Lista de Mejoras para ServiceMonitor

> Guardado el 31 de enero de 2026

---

## 🔔 Notificaciones y Alertas
- [ ] **Notificaciones por email** cuando un servicio cae o vuelve a estar online
- [ ] **Webhooks** para integrar con Slack, Discord, Telegram
- [x] **Notificaciones push** del navegador - Sistema completo con sonido
- [ ] **Alertas por SMS** para servicios críticos

## 📊 Analítica y Reporting
- [x] **Histórico de uptime** con gráficas de tendencias (7, 30, 90 días)
- [ ] **SLA Calculator** - calcular porcentaje de disponibilidad por servicio
- [ ] **Reportes automáticos** enviados por email semanal/mensual
- [x] **Comparativa de tiempos de respuesta** entre servicios - PingChart con stats

## 🔐 Autenticación y Seguridad
- [x] **Sistema de usuarios** con login/registro
- [ ] **Roles y permisos** (admin, viewer, etc.)
- [ ] **API Keys** para acceso programático
- [ ] **Autenticación OAuth** (Google, GitHub)

## ⚙️ Funcionalidades Avanzadas
- [ ] **Checks desde múltiples ubicaciones** (US, EU, Asia)
- [ ] **Verificación de contenido** - buscar texto específico en la respuesta
- [ ] **Headers personalizados** y autenticación en las peticiones
- [x] **SSL certificate monitoring** - SSLInfo, SSLBadge con alertas visuales
- [ ] **Dominio expiration monitoring** - alertar cuando expiren dominios
- [x] **Tags/Etiquetas** - Organizar servicios con tags y filtrar por ellos
- [x] **Grupos de servicios** - ServiceGroup para organizar servicios
- [x] **Maintenance windows** - Programar ventanas de mantenimiento

## 🎨 UX/UI Mejoras (Estilo Uptime Kuma)
- [x] **Dashboard personalizable** - widgets con estadísticas
- [x] **Modo compacto** para pantallas pequeñas
- [x] **Atajos de teclado** (Ctrl+N nuevo servicio, / para buscar)
- [x] **Búsqueda global** con Cmd+K
- [x] **Tours interactivos** para nuevas funcionalidades
- [x] **Heatmap de uptime** - visualización gráfica (UptimeHeatmap)
- [x] **Gráficas de rendimiento** - tendencias de latencia (PerformanceChart)
- [x] **HeartbeatBar** - Barra visual de latidos como Uptime Kuma
- [x] **PingChart** - Gráfico de latencia en tiempo real
- [x] **Sistema de notificaciones** - NotificationBell con panel desplegable

## 🛠️ DevOps y Escalabilidad
- [ ] **Docker** para fácil despliegue
- [x] **Tests automatizados** (unit, integration, e2e) - Jest, Cypress configurados
- [ ] **CI/CD pipeline** con GitHub Actions
- [ ] **Migración a PostgreSQL** para producción
- [ ] **Redis** para cache de checks frecuentes

## 💡 Ideas Creativas
- [x] **Status page pública** - página de estado para tus usuarios
- [x] **Incident management** - crear y gestionar incidentes
- [x] **Página de login** - sistema de autenticación con JWT
- [x] **Maintenance windows** - programar ventanas de mantenimiento
- [ ] **Team collaboration** - comentarios en servicios, @mentions
- [ ] **Integración con GitHub** - mostrar últimos commits/deploys

---

## Componentes Estilo Uptime Kuma Implementados

### HeartbeatBar.jsx
- Barra visual de "latidos" del servicio
- Colores por estado (verde/rojo/amarillo)
- Animaciones de pulso
- Tooltips con detalles
- UptimePercentages con períodos (24h, 7d, 30d)

### SSLInfo.jsx
- SSLBadge - Badge compacto de certificado
- SSLInfo - Panel completo con detalles
- Alertas visuales de expiración
- Indicador de seguridad

### ServiceTags.jsx
- Tags coloridos con hash para colores
- ServiceTags - Gestión de etiquetas
- TagFilter - Filtrar servicios por tags

### ServiceGroup.jsx
- Grupos expandibles de servicios
- Estadísticas del grupo
- GroupManager - CRUD de grupos
- GroupSelector para formularios

### NotificationSystem.jsx
- NotificationProvider - Context para notificaciones
- NotificationBell - Campana con badge
- NotificationPanel - Panel desplegable
- Sonidos de alerta personalizados
- Permisos de navegador

### MaintenanceWindow.jsx
- MaintenanceScheduler - Programar mantenimientos
- MaintenanceList - Lista de mantenimientos
- MaintenanceBadge - Badge de estado
- Soporte para mantenimientos recurrentes

### PingChart.jsx
- PingChart - Gráfico SVG de latencia
- PingStats - Estadísticas (avg, min, max)
- LatencyIndicator - Badge de latencia
- LivePingChart - Chart en tiempo real

---

## Notas

- ✅ Completado: **UX/UI Mejoras** - Todas las mejoras de UI/UX han sido implementadas
- ✅ Completado: **Testing** - Suite completa de tests (Jest, Cypress)
- ✅ Completado: **Autenticación** - Sistema de login JWT implementado
- ✅ Completado: **Métricas** - Uptime tracking y métricas de rendimiento
- ✅ Completado: **Status Pública & Incidentes** - Páginas de estado y gestión de incidentes
- ✅ Completado: **Estilo Uptime Kuma** - HeartbeatBar, PingChart, SSL, Tags, Grupos, Notificaciones
- ✅ Completado: **Mejoras de Código** - Refactorización y optimización (ver abajo)
- 🔄 Próximas mejoras a implementar:
  1. Notificaciones por email/Webhooks
  2. Docker para despliegue
  3. Checks desde múltiples ubicaciones
  4. Integración con GitHub

---

## Mejoras de Código Implementadas

### Utilidades Compartidas
- `src/utils/formatters.js` - Funciones de formateo (fechas, tiempo, bytes)
- `src/utils/statusConfig.js` - Configuración centralizada de estados

### Hooks Personalizados
- `src/hooks/useServiceLogs.js` - Hook para cargar logs de servicio con auto-refresh

### Componentes Optimizados
- `src/components/ErrorBoundary.jsx` - Captura errores de React
- `src/components/ServiceCardRefactored.jsx` - ServiceCard dividido en subcomponentes:
  - `StatusIndicator` - Indicador de estado
  - `StatusBadge` - Badge de estado
  - `VisibilityBadge` - Badge público/privado
  - `ActionButton` - Botón de acción reutilizable
  - `MetricsGrid` - Grid de métricas
  - `ServiceHeader` - Encabezado de tarjeta
  - `CompactServiceCard` - Tarjeta compacta
  - `NormalServiceCard` - Tarjeta normal

### Optimizaciones de Rendimiento
- Memoización con `memo()` en subcomponentes
- `useCallback` para handlers en App.jsx
- `useMemo` para datos derivados
- Error Boundary global en main.jsx
  2. Docker para despliegue
  3. Checks desde múltiples ubicaciones
  4. Integración con GitHub
