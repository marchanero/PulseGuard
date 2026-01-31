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

## 🎨 UX/UI Mejoras (EN PROGRESO)
- [ ] **Dashboard personalizable** - widgets arrastrables
- [ ] **Modo compacto** para pantallas pequeñas
- [ ] **Atajos de teclado** (Ctrl+N nuevo servicio, / para buscar)
- [ ] **Búsqueda global** con Cmd+K
- [ ] **Tours interactivos** para nuevas funcionalidades

## 🛠️ DevOps y Escalabilidad
- [ ] **Docker** para fácil despliegue
- [ ] **Tests automatizados** (unit, integration, e2e)
- [ ] **CI/CD pipeline** con GitHub Actions
- [ ] **Migración a PostgreSQL** para producción
- [ ] **Redis** para cache de checks frecuentes

## 💡 Ideas Creativas
- [ ] **Status page pública** - página de estado para tus usuarios
- [ ] **Incident management** - crear y gestionar incidentes
- [ ] **Maintenance windows** - programar ventanas de mantenimiento
- [ ] **Team collaboration** - comentarios en servicios, @mentions
- [ ] **Integración con GitHub** - mostrar últimos commits/deploys

---

## Notas

- Prioridad actual: **UX/UI Mejoras**
- Próximas mejoras a implementar:
  1. Atajos de teclado
  2. Búsqueda global (Cmd+K)
  3. Dashboard personalizable
  4. Modo compacto
