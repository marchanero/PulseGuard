import express from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import dotenv from 'dotenv';
import { db } from '../lib/db.js';
import { users } from '../lib/schema.js';
import { eq, or } from 'drizzle-orm';

dotenv.config();

const router = express.Router();

// Middleware de sesión con almacenamiento en memoria y cookies persistentes
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  name: 'pulseguard.sid'
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
    const existingUser = await db.select().from(users).where(
      or(
        eq(users.username, username),
        eq(users.email, email),
        eq(users.alias, alias)
      )
    ).limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El usuario, email o alias ya está registrado' });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await db.insert(users).values({
      username,
      email,
      alias,
      passwordHash
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      alias: users.alias,
      createdAt: users.createdAt
    });

    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado correctamente',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario', details: error.message });
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
    const user = await db.select().from(users).where(
      or(
        eq(users.username, username),
        eq(users.email, username)
      )
    ).limit(1);
    
    if (user.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const isValid = await bcrypt.compare(password, user[0].passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Crear sesión
    req.session.isAuthenticated = true;
    req.session.userId = user[0].id;
    req.session.username = user[0].username;
    req.session.loginTime = new Date().toISOString();
    
    res.json({ 
      success: true, 
      message: 'Autenticación exitosa',
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        alias: user[0].alias
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
    const user = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      alias: users.alias,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, req.session.userId)).limit(1);
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ user: user[0] });
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
