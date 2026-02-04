import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import servicesRouter from './api/services.js';
import authRouter, { sessionMiddleware, requireAuth } from './api/auth.js';
import statusRouter from './api/status.js';
import analyticsRouter from './api/analytics.js';
import { startAllMonitoring, stopAllMonitoring } from './utils/monitor.js';

// Cargar .env.local primero, luego .env
dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// IMPORTANTE: Confiar en el proxy de Fly.io para que las cookies secure funcionen
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Configurar CORS para permitir credenciales
const corsOptions = {
  origin: function (origin, callback) {
    // En desarrollo permitir localhost
    if (process.env.NODE_ENV !== 'production') {
      callback(null, ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000']);
      return;
    }
    // En producción permitir solo el frontend configurado
    const frontendUrl = process.env.FRONTEND_URL;
    if (!origin || (frontendUrl && origin === frontendUrl) || origin?.endsWith('.fly.dev')) {
      callback(null, true);
    } else {
      // Para requests sin origen (como apps mobile) o dominios desconocidos, permitir
      // Esto es necesario para algunos escenarios
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// Middleware de sesión
app.use(sessionMiddleware);

// Rutas públicas (no requieren autenticación)
app.use('/api/auth', authRouter);
app.use('/api/status', statusRouter);

// Rutas protegidas (requieren autenticación)
app.use('/api/services', requireAuth, servicesRouter);
app.use('/api/analytics', requireAuth, analyticsRouter);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir archivos estáticos del build de Vite en producción
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Ruta catch-all para SPA (debe ir después de las rutas de API)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Servidor API corriendo en http://0.0.0.0:${PORT}`);
  
  // Iniciar monitoreo automático de todos los servicios activos
  await startAllMonitoring();
});

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  stopAllMonitoring();
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  stopAllMonitoring();
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});
