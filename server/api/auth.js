import express from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

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

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { username, email, alias, password } = req.body;

    // Validar campos requeridos
    if (!username || !email || !alias || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { alias }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El usuario, email o alias ya está registrado' });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        username,
        email,
        alias,
        passwordHash
      },
      select: {
        id: true,
        username: true,
        email: true,
        alias: true,
        createdAt: true
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado correctamente',
      user 
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    
    // Buscar usuario por username o email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Crear sesión
    req.session.isAuthenticated = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.loginTime = new Date().toISOString();
    
    res.json({ 
      success: true, 
      message: 'Autenticación exitosa',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        alias: user.alias
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en autenticación' });
  }
});

// Verificar sesión
router.get('/check', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.json({ 
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Obtener datos del usuario
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        alias: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
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

export default router;
