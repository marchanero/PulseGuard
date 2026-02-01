import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import servicesRouter from './api/services.js';
import authRouter, { sessionMiddleware, requireAuth } from './api/auth.js';
import statusRouter from './api/status.js';
import analyticsRouter from './api/analytics.js';
import { startAllMonitoring, stopAllMonitoring } from './utils/monitor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar CORS para permitir credenciales
app.use(cors({
  origin: true,
  credentials: true
}));
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

const server = app.listen(PORT, async () => {
  console.log(`Servidor API corriendo en http://localhost:${PORT}`);
  
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
