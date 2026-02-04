# PulseGuard 🚀

> Sistema de monitorización de servicios en tiempo real con una interfaz moderna y dark mode

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-0.45-FF6B35?logo=drizzle)](https://orm.drizzle.team/)
[![TursoDB](https://img.shields.io/badge/TursoDB-LibSQL-4ADE80?logo=sqlite)](https://turso.io/)

PulseGuard es una aplicación full-stack moderna para monitorizar el estado de tus servicios web en tiempo real. Con una interfaz elegante, dark mode, atajos de teclado, y verificación automática configurable.

![Dashboard Preview](https://via.placeholder.com/800x400/1e293b/ffffff?text=PulseGuard+Dashboard)

## ✨ Características

### 🎯 Core
- **Monitorización en tiempo real** - Verifica el estado de tus servicios automáticamente
- **Intervalos configurables** - Desde 10 segundos hasta 1 hora
- **Histórico de logs** - Registro completo de todas las verificaciones
- **Múltiples estados** - Online, Offline, Degradado, Timeout, Desconocido
- **Múltiples tipos de servicios** - HTTP, TCP, Ping, DNS y más
- **Uptime tracking** - Cálculo automático de porcentaje de disponibilidad
- **Métricas de rendimiento** - Latencia, tiempo de respuesta, código de estado

### 🎨 UI/UX
- **Dark/Light mode** - Cambio instantáneo con persistencia
- **Modo compacto** - Para monitoreo constante con muchos servicios
- **Vista Grid/Lista** - Adapta la visualización a tus necesidades
- **Command Palette** - Búsqueda global con `Ctrl+K`
- **Atajos de teclado** - Navegación rápida sin ratón
- **Animaciones fluidas** - Transiciones suaves en toda la app
- **Heatmap de uptime** - Visualización gráfica de disponibilidad
- **Gráficas de rendimiento** - Tendencias de latencia y tiempos de respuesta

### 🛠️ Funcionalidades
- **Filtros avanzados** - Por estado, nombre, tiempo de respuesta
- **Ordenamiento** - Por nombre, estado, uptime, última verificación
- **Exportación de datos** - JSON y CSV
- **Soft delete** - Elimina servicios preservando el historial
- **Onboarding interactivo** - Tutorial para nuevos usuarios
- **Gestión de incidentes** - Crear y rastrear incidentes por servicio
- **Página de estado pública** - Comparte el estado con tus usuarios

## 🚀 Instalación

### Requisitos
- Node.js 18+
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/marchanero/PulseGuard.git
cd PulseGuard
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar la base de datos (TursoDB)**
```bash
# Crear archivo .env con las variables de entorno
cp .env.example .env

# Editar .env con tu URL de Turso
export DATABASE_URL="libsql://tu-db.turso.io?authToken=tu-token"
```

4. **Iniciar la aplicación**
```bash
npm run dev
```

Esto iniciará:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + N` | Añadir nuevo servicio |
| `Ctrl + K` | Abrir Command Palette |
| `/` | Buscar servicios |
| `Esc` | Cerrar modales/drawers |
| `G` | Cambiar vista (Grid/Lista) |
| `F` | Abrir/cerrar filtros |
| `R` | Refrescar datos |
| `C` | Toggle modo compacto |
| `?` | Mostrar ayuda de atajos |

## 🚀 Despliegue en Fly.io

PulseGuard está configurado para desplegarse automáticamente en [Fly.io](https://fly.io).

### URL de producción

🔗 **https://pulseguard-fragrant-paper-4573.fly.dev**

### Despliegue automático

El proyecto usa GitHub Actions para CI/CD:

1. **Rama `develop`** → Desarrollo (sin despliegue)
2. **Rama `main`** → Producción (despliegue automático)

### Flujo de trabajo

1. Trabaja en la rama `develop`
2. Haz commits y push a `develop`
3. Crea un Pull Request a `main`
4. Merge a `main` → Se ejecuta el workflow de CI/CD
5. Los tests pasan → Deploy automático a Fly.io

### Configuración requerida

Para el primer despliegue, necesitas:

1. **Instalar flyctl**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Obtener token de API**
```bash
flyctl auth token
```

3. **Añadir secreto en GitHub**
   - Ve a Settings → Secrets and variables → Actions
   - Crea un secreto llamado `FLY_API_TOKEN`
   - Pega el token obtenido

### Variables de entorno en producción

La base de datos usa [TursoDB](https://turso.io/) (libSQL) tanto en desarrollo como en producción. Configura los secretos en Fly.io:

```bash
fly secrets set DATABASE_URL="libsql://tu-db.turso.io?authToken=TU_TOKEN"
fly secrets set TURSO_AUTH_TOKEN="tu-auth-token"
```

### Base de datos

- **Desarrollo:** TursoDB (libSQL) - misma configuración que producción
- **Producción:** TursoDB (libSQL)

Las migraciones se aplican automáticamente en producción.

## 📁 Estructura del Proyecto

```
PulseGuard/
├── drizzle/                 # Configuración y migraciones de Drizzle
├── prisma/                  # Schema legacy de Prisma (mantenido por compatibilidad)
│   └── migrations/        # Migraciones existentes
├── server/                  # Backend API
│   ├── api/               # Rutas de la API
│   ├── lib/               # Configuración de DB y schema (Drizzle)
│   ├── utils/             # Utilidades (health checks, monitor)
│   └── index.js           # Entry point del servidor
├── src/                    # Frontend React
│   ├── components/        # Componentes React
│   ├── context/           # Contextos (tema, toast, auth)
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilidades frontend
└── package.json
```

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env` en la raíz:

```env
# Backend
SESSION_SECRET="tu-secret-session"
PORT=3001

# Base de datos TursoDB
DATABASE_URL="libsql://tu-db.turso.io?authToken=TU_TOKEN"
TURSO_AUTH_TOKEN="tu-auth-token"

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### Intervalos de verificación

Puedes configurar el intervalo de verificación para cada servicio:
- 10 segundos (para servicios críticos)
- 30 segundos
- 1 minuto
- 5 minutos
- 15 minutos
- 30 minutos
- 1 hora

## 📊 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/services` | Listar todos los servicios |
| POST | `/api/services` | Crear nuevo servicio |
| GET | `/api/services/:id` | Obtener servicio por ID |
| PUT | `/api/services/:id` | Actualizar servicio |
| DELETE | `/api/services/:id` | Eliminar servicio (soft delete) |
| POST | `/api/services/:id/check` | Verificar servicio manualmente |
| POST | `/api/services/check-all` | Verificar todos los servicios |
| POST | `/api/services/:id/restore` | Restaurar servicio eliminado |
| DELETE | `/api/services/:id/permanent` | Eliminar permanentemente |
| GET | `/api/services/:id/metrics` | Métricas de rendimiento del servicio |
| GET | `/api/services/:id/uptime` | Estadísticas de uptime |
| GET | `/api/analytics/overview` | Dashboard analytics |
| GET | `/api/status/public` | Estado público de todos los servicios |
| GET | `/api/incidents` | Listar incidentes |
| POST | `/api/incidents` | Crear nuevo incidente |
| GET | `/api/incidents/:id` | Obtener incidente por ID |
| PUT | `/api/incidents/:id` | Actualizar incidente |
| DELETE | `/api/incidents/:id` | Eliminar incidente |
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/check` | Verificar sesión |

## 🛣️ Roadmap

### Próximas mejoras
- [x] **Notificaciones** - Sistema base implementado
- [x] **Autenticación** - Sistema de registro/login con JWT
- [x] **Status Page pública** - Página de estado para tus clientes
- [x] **Múltiples tipos de checks** - HTTP, TCP, Ping, DNS
- [x] **Métricas de rendimiento** - Latencia y uptime tracking
- [x] **Drizzle ORM** - Migración desde Prisma a Drizzle
- [ ] **SSL Certificate monitoring** - Alertas de expiración de certificados
- [ ] **Docker** - Contenedores para fácil despliegue
- [ ] **Webhooks** - Integración con Slack, Discord, Telegram
- [ ] **Checks desde múltiples ubicaciones** - US, EU, Asia

Consulta [`IMPROVEMENTS.md`](IMPROVEMENTS.md) para la lista completa de mejoras implementadas y pendientes.

## 🛡️ Tecnologías

### Frontend
- **React 19** - UI library
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Iconos
- **Recharts** - Gráficos y estadísticas

### Backend
- **Express.js 5** - Framework web
- **Drizzle ORM** - ORM moderno y ligero
- **TursoDB (libSQL)** - Base de datos cloud edge
- **Node-cron** - Tareas programadas
- **JWT** - Autenticación basada en tokens

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 🧪 Testing

PulseGuard cuenta con un sistema de testing completo configurado con Jest, React Testing Library, Supertest y Cypress.

### Scripts de Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests con cobertura
npm run test:coverage

# Tests solo de API
npm run test:api

# Tests solo de unidad (frontend)
npm run test:unit

# Tests E2E con Cypress
npm run test:e2e

# Abrir Cypress en modo interactivo
npm run cypress:open
```

### Estructura de Tests

```
PulseGuard/
├── src/
│   ├── components/
│   │   └── __tests__/           # Tests de componentes
│   ├── hooks/
│   │   └── __tests__/           # Tests de hooks
│   └── utils/
│       └── __tests__/           # Tests de utilidades
├── server/
│   └── __tests__/               # Tests de API
├── cypress/
│   ├── e2e/                     # Tests E2E
│   ├── fixtures/                # Datos de prueba
│   └── support/                 # Comandos y configuración
├── __mocks__/                   # Mocks globales
├── jest.config.js               # Configuración de Jest
├── jest.setup.js                # Setup de Jest
├── babel.config.js              # Configuración de Babel
└── cypress.config.js            # Configuración de Cypress
```

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Roberto Sánchez** - [@marchanero](https://github.com/marchanero)

---

<p align="center">
  <strong>⭐ Star este repo si te ha sido útil!</strong>
</p>
