import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import servicesRouter from './api/services.js';
import { startAllMonitoring, stopAllMonitoring } from './utils/monitor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/services', servicesRouter);

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
