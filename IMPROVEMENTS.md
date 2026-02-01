# Lista de Mejoras para ServiceMonitor

> Guardado el 31 de enero de 2026

---

## 🔔 Notificaciones y Alertas
- [ ] **Notificaciones por email** cuando un servicio cae o vuelve a estar online
- [ ] **Webhooks** para integrar con Slack, Discord, Telegram
- [ ] **Notificaciones push** del navegador
- [ ] **Alertas por SMS** para servicios críticos

## 📊 Analítica y Reporting
- [ ] **Histórico de uptime** con gráficas de tendencias (7, 30, 90 días)
- [ ] **SLA Calculator** - calcular porcentaje de disponibilidad por servicio
- [ ] **Reportes automáticos** enviados por email semanal/mensual
- [ ] **Comparativa de tiempos de respuesta** entre servicios

## 🔐 Autenticación y Seguridad
- [ ] **Sistema de usuarios** con login/registro
- [ ] **Roles y permisos** (admin, viewer, etc.)
- [ ] **API Keys** para acceso programático
- [ ] **Autenticación OAuth** (Google, GitHub)

## ⚙️ Funcionalidades Avanzadas
- [ ] **Checks desde múltiples ubicaciones** (US, EU, Asia)
- [ ] **Verificación de contenido** - buscar texto específico en la respuesta
- [ ] **Headers personalizados** y autenticación en las peticiones
- [ ] **SSL certificate monitoring** - alertar cuando expiren certificados
- [ ] **Dominio expiration monitoring** - alertar cuando expiren dominios

## 🎨 UX/UI Mejoras
- [x] **Dashboard personalizable** - widgets con estadísticas
- [x] **Modo compacto** para pantallas pequeñas
- [x] **Atajos de teclado** (Ctrl+N nuevo servicio, / para buscar)
- [x] **Búsqueda global** con Cmd+K
- [x] **Tours interactivos** para nuevas funcionalidades
- [x] **Heatmap de uptime** - visualización gráfica
- [x] **Gráficas de rendimiento** - tendencias de latencia

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
- [ ] **Maintenance windows** - programar ventanas de mantenimiento
- [ ] **Team collaboration** - comentarios en servicios, @mentions
- [ ] **Integración con GitHub** - mostrar últimos commits/deploys

---

## Notas

- ✅ Completado: **UX/UI Mejoras** - Todas las mejoras de UI/UX han sido implementadas
- ✅ Completado: **Testing** - Suite completa de tests (Jest, Cypress)
- ✅ Completado: **Autenticación** - Sistema de login JWT implementado
- ✅ Completado: **Métricas** - Uptime tracking y métricas de rendimiento
- ✅ Completado: **Status Pública & Incidentes** - Páginas de estado y gestión de incidentes
- 🔄 Próximas mejoras a implementar:
  1. Notificaciones (Email, Webhooks, Slack)
  2. SSL Certificate monitoring
  3. Docker para despliegue
  4. Checks desde múltiples ubicaciones
