import express from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import dotenv from 'dotenv';
import { eq, or } from 'drizzle-orm';
import { db, users } from '../db/index.js';

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
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    sameSite: 'lax'
  }
});

// Middleware para verificar autenticación
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  return res.status(401).json({ error: 'No autorizado' });
};

// Login con usuario y contraseña
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }
    
    // Buscar usuario por username o email
    const [user] = await db.select().from(users)
      .where(or(
        eq(users.username, username),
        eq(users.email, username)
      ));
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Crear sesión
    req.session.isAuthenticated = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.alias = user.alias;
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

// Registro de nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, alias } = req.body;
    
    // Validaciones
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email y contraseña son requeridos' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'El username debe tener al menos 3 caracteres' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del email no es válido' });
    }
    
    // Verificar si el usuario ya existe
    const [existingUser] = await db.select().from(users)
      .where(or(
        eq(users.username, username),
        eq(users.email, email)
      ));
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }
    
    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const now = new Date().toISOString();
    const [newUser] = await db.insert(users).values({
      username,
      email,
      alias: alias || username,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    // Crear sesión automáticamente después del registro
    req.session.isAuthenticated = true;
    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    req.session.alias = newUser.alias;
    req.session.loginTime = now;
    
    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        alias: newUser.alias
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Verificar sesión
router.get('/check', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.json({ 
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        alias: req.session.alias
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Obtener perfil del usuario actual
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      alias: users.alias,
      createdAt: users.createdAt,
    }).from(users)
      .where(eq(users.id, req.session.userId));
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
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
