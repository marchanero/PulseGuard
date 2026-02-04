<p align="center">
  <img src="https://img.shields.io/badge/🛡️_PulseGuard-Monitoring_Made_Beautiful-667eea?style=for-the-badge&labelColor=1a1a2e" alt="PulseGuard" />
</p>

<h1 align="center">
  🛡️ PulseGuard
</h1>

<h3 align="center">
  Sistema de Monitorización de Servicios de Nueva Generación
</h3>

<p align="center">
  <em>Mantén el pulso de tu infraestructura con estilo</em>
</p>

<p align="center">
  <a href="https://pulseguard-fragrant-paper-4573.fly.dev/status">
    <img src="https://img.shields.io/badge/🚀_Demo_Live-Visitar-667eea?style=for-the-badge" alt="Demo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Drizzle-ORM-FF6B35?style=flat-square" alt="Drizzle" />
  <img src="https://img.shields.io/badge/TursoDB-Edge-4ADE80?style=flat-square" alt="TursoDB" />
  <img src="https://img.shields.io/badge/Fly.io-Deployed-8B5CF6?style=flat-square&logo=fly.io&logoColor=white" alt="Fly.io" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/marchanero/PulseGuard?style=flat-square&color=green" alt="License" />
  <img src="https://img.shields.io/github/stars/marchanero/PulseGuard?style=flat-square&color=yellow" alt="Stars" />
  <img src="https://img.shields.io/github/last-commit/marchanero/PulseGuard?style=flat-square&color=blue" alt="Last Commit" />
</p>

---

## ⚡ ¿Qué es PulseGuard?

**PulseGuard** es una plataforma de monitorización full-stack moderna y elegante que te permite supervisar el estado de tus servicios web, APIs y servidores en tiempo real. 

Diseñado con una UI/UX excepcional, dark mode por defecto, y potentes funcionalidades como Command Palette, atajos de teclado, y verificación automática configurable.

<p align="center">
  <img src="https://via.placeholder.com/900x450/0f172a/667eea?text=🛡️+PulseGuard+Dashboard" alt="Dashboard Preview" width="100%" />
</p>

### 🎯 Perfecto para:

| 👤 Usuario | 💡 Caso de Uso |
|:-----------|:---------------|
| **DevOps** | Monitoriza toda tu infraestructura desde un solo lugar |
| **Desarrolladores** | Vigila tus APIs y microservicios en desarrollo y producción |
| **Equipos** | Comparte el estado con tu equipo mediante la página de status pública |
| **Freelancers** | Mantén a tus clientes informados del estado de sus servicios |

---

## ✨ Características

<table>
<tr>
<td width="50%">

### 🔍 Monitorización Inteligente

- ✅ **Múltiples protocolos**: HTTP, HTTPS, TCP, Ping, DNS
- ✅ **Intervalos flexibles**: 10s, 30s, 1m, 5m, 15m, 30m, 1h
- ✅ **Detección de estados**: Online, Offline, Degradado, Timeout
- ✅ **Content matching**: Verifica contenido específico
- ✅ **Uptime tracking**: Cálculo automático de disponibilidad

</td>
<td width="50%">

### 📊 Analytics y Métricas

- ✅ **Latencia histórica**: Gráficas de tendencias
- ✅ **Heatmap visual**: Visualiza la salud a lo largo del tiempo
- ✅ **Exportación**: JSON y CSV para reportes
- ✅ **Dashboard overview**: Estadísticas agregadas
- ✅ **Métricas de rendimiento**: Tiempos de respuesta

</td>
</tr>
<tr>
<td width="50%">

### 🎨 UI/UX Premium

- ✅ **Dark/Light mode**: Cambio instantáneo con persistencia
- ✅ **Command Palette**: Búsqueda global con `Ctrl+K`
- ✅ **Atajos de teclado**: Navegación sin ratón
- ✅ **Vista Grid/Lista**: Adapta la visualización
- ✅ **Modo compacto**: Para muchos servicios
- ✅ **Animaciones fluidas**: Micro-interacciones elegantes

</td>
<td width="50%">

### 🛠️ Gestión Avanzada

- ✅ **Filtros y ordenamiento**: Por estado, nombre, uptime
- ✅ **Soft delete**: Elimina preservando historial
- ✅ **Gestión de incidentes**: Trackea y documenta issues
- ✅ **Status page pública**: Comparte con tus usuarios
- ✅ **Autenticación**: Sistema completo de usuarios
- ✅ **Onboarding**: Tutorial para nuevos usuarios

</td>
</tr>
</table>

---

## 🚀 Inicio Rápido

### Prerrequisitos

```
Node.js 18+  •  npm o yarn  •  Cuenta en Turso (gratis)
```

### Instalación en 3 pasos

```bash
# 1️⃣ Clonar el repositorio
git clone https://github.com/marchanero/PulseGuard.git
cd PulseGuard

# 2️⃣ Instalar dependencias
npm install

# 3️⃣ Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de Turso

# 🎉 Iniciar la aplicación
npm run dev
```

> **Nota:** Esto iniciará Frontend en `http://localhost:5173` y Backend API en `http://localhost:3001`

<details>
<summary>📋 Configuración detallada de variables de entorno</summary>

```env
# 🔐 Backend
SESSION_SECRET="genera-un-secret-seguro-aqui"
PORT=3001

# 💾 Base de datos (TursoDB)
DATABASE_URL="libsql://tu-db.turso.io"
TURSO_AUTH_TOKEN="tu-auth-token"

# 🌐 Frontend (opcional en desarrollo)
VITE_API_URL=http://localhost:3001/api
```

</details>

---

## ⌨️ Atajos de Teclado

PulseGuard está diseñado para usuarios power que aman los atajos.

| Atajo | Acción |
|:------|:-------|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | 🔍 Command Palette |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | ➕ Nuevo servicio |
| <kbd>/</kbd> | 🔎 Buscar servicios |
| <kbd>G</kbd> | 🔄 Cambiar vista Grid/Lista |
| <kbd>C</kbd> | 📦 Modo compacto |
| <kbd>R</kbd> | 🔄 Refrescar datos |
| <kbd>F</kbd> | 🎛️ Abrir filtros |
| <kbd>?</kbd> | ❓ Ayuda de atajos |
| <kbd>Esc</kbd> | ✖️ Cerrar modales |

---

## 🌐 Despliegue en Producción

### Fly.io (Recomendado)

PulseGuard está optimizado para Fly.io con despliegue automático:

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login y configurar secretos
fly auth login
fly secrets set DATABASE_URL="libsql://tu-db.turso.io"
fly secrets set TURSO_AUTH_TOKEN="tu-token"
fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"

# Desplegar 🚀
fly deploy
```

<details>
<summary>🔧 Script de ayuda incluido</summary>

```bash
# Ejecutar script de configuración
./scripts/fly-setup.sh
```

</details>

### 🔗 Demo en vivo

<p align="center">
  <a href="https://pulseguard-fragrant-paper-4573.fly.dev/status">
    <img src="https://img.shields.io/badge/🌐_pulseguard--fragrant--paper--4573.fly.dev/status-Visitar-667eea?style=for-the-badge" alt="Demo Live" />
  </a>
</p>

---

## 📁 Arquitectura

```
PulseGuard/
├── 📂 server/                 # 🖥️ Backend Express
│   ├── api/                   # Endpoints REST
│   │   ├── auth.js           # Autenticación
│   │   ├── services.js       # CRUD servicios
│   │   ├── analytics.js      # Métricas
│   │   └── status.js         # Status público
│   ├── lib/                   # Core
│   │   ├── db.js             # Conexión Turso/Drizzle
│   │   └── schema.js         # Esquema de BD
│   └── utils/                 # Utilidades
│       ├── checkTypes.js     # Health checks
│       └── monitor.js        # Monitor automático
│
├── 📂 src/                    # ⚛️ Frontend React
│   ├── components/           # Componentes UI
│   ├── context/              # Estado global
│   ├── hooks/                # Custom hooks
│   └── utils/                # Helpers
│
├── 📂 cypress/                # 🧪 Tests E2E
├── 📄 fly.toml               # Config Fly.io
├── 📄 Dockerfile             # Container build
└── 📄 drizzle.config.ts      # Config Drizzle ORM
```

---

## 📊 API Reference

<details>
<summary><b>📋 Ver todos los endpoints</b></summary>

### Servicios
| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| `GET` | `/api/services` | Listar servicios |
| `POST` | `/api/services` | Crear servicio |
| `GET` | `/api/services/:id` | Obtener servicio |
| `PUT` | `/api/services/:id` | Actualizar servicio |
| `DELETE` | `/api/services/:id` | Eliminar (soft) |
| `POST` | `/api/services/:id/check` | Verificar ahora |
| `GET` | `/api/services/:id/metrics` | Métricas |
| `GET` | `/api/services/:id/uptime` | Estadísticas uptime |

### Autenticación
| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| `POST` | `/api/auth/register` | Registro |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/check` | Verificar sesión |

### Analytics & Status
| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| `GET` | `/api/analytics/overview` | Dashboard stats |
| `GET` | `/api/status/public` | Status público |
| `GET` | `/api/incidents` | Listar incidentes |

</details>

---

## 🛡️ Stack Tecnológico

<table>
<tr>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="40" />
<br><b>React 19</b>
</td>
<td align="center" width="20%">
<img src="https://vitejs.dev/logo.svg" width="40" />
<br><b>Vite 7</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="40" />
<br><b>Tailwind CSS</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="40" />
<br><b>Express 5</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg" width="40" />
<br><b>TursoDB</b>
</td>
</tr>
</table>

---

## 🗺️ Roadmap

- [x] ✅ Monitorización multi-protocolo
- [x] ✅ Dark/Light mode
- [x] ✅ Command Palette
- [x] ✅ Autenticación de usuarios
- [x] ✅ Status page pública
- [x] ✅ Métricas y analytics
- [x] ✅ Drizzle ORM + TursoDB
- [ ] 🔜 Notificaciones (Slack, Discord, Email)
- [ ] 🔜 Checks desde múltiples regiones
- [ ] 🔜 SSL Certificate monitoring
- [ ] 🔜 Webhooks personalizados

---

## 🧪 Testing

```bash
npm test              # Todos los tests
npm run test:coverage # Con cobertura
npm run test:api      # Solo API
npm run cypress:open  # E2E con Cypress
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! 

```bash
git checkout -b feature/amazing-feature
git commit -m '✨ Add amazing feature'
git push origin feature/amazing-feature
# Abrir Pull Request
```

---

## 📝 Licencia

Distribuido bajo la licencia **MIT**. Ver [LICENSE](LICENSE) para más información.

---

## 👨‍💻 Autor

<p align="center">
  <a href="https://github.com/marchanero">
    <img src="https://img.shields.io/badge/GitHub-marchanero-181717?style=for-the-badge&logo=github" alt="GitHub" />
  </a>
</p>

---

<p align="center">
  <b>¿Te gusta PulseGuard?</b>
  <br><br>
  <a href="https://github.com/marchanero/PulseGuard">
    ⭐ Dale una estrella en GitHub
  </a>
</p>

<p align="center">
  <sub>Hecho con ❤️ y mucho ☕</sub>
</p>
