import express from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Middleware de sesión
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
});

// Middleware para verificar autenticación
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  return res.status(401).json({ error: 'No autorizado' });
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }
    
    // Verificar contra el hash almacenado en .env
    const hashedPassword = process.env.ADMIN_PASSWORD_HASH;
    
    if (!hashedPassword) {
      return res.status(500).json({ error: 'Configuración de autenticación incompleta' });
    }
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Crear sesión
    req.session.isAuthenticated = true;
    req.session.loginTime = new Date().toISOString();
    
    res.json({ success: true, message: 'Autenticación exitosa' });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en autenticación' });
  }
});

// Verificar sesión
router.get('/check', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ success: true, message: 'Sesión cerrada' });
  });
});

// Endpoint para generar hash (solo para configuración inicial)
router.post('/hash', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    res.json({ hash });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar hash' });
  }
});

export default router;