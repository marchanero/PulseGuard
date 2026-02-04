import express from 'express';
import { db, maintenanceWindows, services } from '../lib/db.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const router = express.Router();

// ===== MAINTENANCE WINDOWS =====

// Get all maintenance windows (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { serviceId, active, upcoming } = req.query;
    
    let query = db.select({
      window: maintenanceWindows,
      service: services
    })
    .from(maintenanceWindows)
    .leftJoin(services, eq(maintenanceWindows.serviceId, services.id))
    .orderBy(desc(maintenanceWindows.startTime));
    
    // Apply filters
    const conditions = [];
    
    if (serviceId) {
      conditions.push(eq(maintenanceWindows.serviceId, parseInt(serviceId)));
    }
    
    if (active === 'true') {
      const now = new Date().toISOString();
      conditions.push(
        and(
          lte(maintenanceWindows.startTime, now),
          gte(maintenanceWindows.endTime, now),
          eq(maintenanceWindows.isActive, true)
        )
      );
    }
    
    if (upcoming === 'true') {
      const now = new Date().toISOString();
      conditions.push(
        and(
          gte(maintenanceWindows.startTime, now),
          eq(maintenanceWindows.isActive, true)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query;
    
    const windows = results.map(r => ({
      ...r.window,
      recurringPattern: r.window.recurringPattern ? JSON.parse(r.window.recurringPattern) : null,
      isRecurring: Boolean(r.window.isRecurring),
      isActive: Boolean(r.window.isActive),
      service: r.service ? {
        id: r.service.id,
        name: r.service.name,
        type: r.service.type
      } : null
    }));
    
    res.json(windows);
  } catch (error) {
    console.error('Error fetching maintenance windows:', error);
    res.status(500).json({ error: 'Error al obtener ventanas de mantenimiento', message: error.message });
  }
});

// Get single maintenance window
router.get('/:id', async (req, res) => {
  try {
    const windowId = parseInt(req.params.id);
    
    const results = await db.select({
      window: maintenanceWindows,
      service: services
    })
    .from(maintenanceWindows)
    .leftJoin(services, eq(maintenanceWindows.serviceId, services.id))
    .where(eq(maintenanceWindows.id, windowId));
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Ventana de mantenimiento no encontrada' });
    }
    
    const r = results[0];
    const window = {
      ...r.window,
      recurringPattern: r.window.recurringPattern ? JSON.parse(r.window.recurringPattern) : null,
      isRecurring: Boolean(r.window.isRecurring),
      isActive: Boolean(r.window.isActive),
      service: r.service ? {
        id: r.service.id,
        name: r.service.name,
        type: r.service.type
      } : null
    };
    
    res.json(window);
  } catch (error) {
    console.error('Error fetching maintenance window:', error);
    res.status(500).json({ error: 'Error al obtener ventana de mantenimiento', message: error.message });
  }
});

// Create maintenance window
router.post('/', async (req, res) => {
  try {
    const { 
      serviceId, 
      title, 
      description, 
      startTime, 
      endTime, 
      isRecurring = false,
      recurringPattern,
      createdBy 
    } = req.body;
    
    // Validation
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Título, fecha de inicio y fin son requeridos' });
    }
    
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }
    
    // Verify service exists if provided
    if (serviceId) {
      const [service] = await db.select().from(services).where(eq(services.id, serviceId));
      if (!service) {
        return res.status(400).json({ error: 'Servicio no encontrado' });
      }
    }
    
    // Validate recurring pattern if recurring
    if (isRecurring && recurringPattern) {
      const validTypes = ['daily', 'weekly', 'monthly'];
      if (!validTypes.includes(recurringPattern.type)) {
        return res.status(400).json({ error: 'Tipo de recurrencia inválido' });
      }
    }
    
    const [newWindow] = await db.insert(maintenanceWindows).values({
      serviceId: serviceId || null,
      title,
      description: description || null,
      startTime,
      endTime,
      isRecurring,
      recurringPattern: recurringPattern ? JSON.stringify(recurringPattern) : null,
      createdBy: createdBy || null
    }).returning();
    
    res.status(201).json({
      ...newWindow,
      recurringPattern: newWindow.recurringPattern ? JSON.parse(newWindow.recurringPattern) : null,
      isRecurring: Boolean(newWindow.isRecurring),
      isActive: Boolean(newWindow.isActive)
    });
  } catch (error) {
    console.error('Error creating maintenance window:', error);
    res.status(500).json({ error: 'Error al crear ventana de mantenimiento', message: error.message });
  }
});

// Update maintenance window
router.put('/:id', async (req, res) => {
  try {
    const windowId = parseInt(req.params.id);
    const { title, description, startTime, endTime, isRecurring, recurringPattern, isActive } = req.body;
    
    const [existing] = await db.select().from(maintenanceWindows).where(eq(maintenanceWindows.id, windowId));
    
    if (!existing) {
      return res.status(404).json({ error: 'Ventana de mantenimiento no encontrada' });
    }
    
    // Validation
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }
    
    const updateData = { 
      updatedAt: new Date().toISOString() 
    };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurringPattern !== undefined) {
      updateData.recurringPattern = recurringPattern ? JSON.stringify(recurringPattern) : null;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const [updated] = await db.update(maintenanceWindows)
      .set(updateData)
      .where(eq(maintenanceWindows.id, windowId))
      .returning();
    
    res.json({
      ...updated,
      recurringPattern: updated.recurringPattern ? JSON.parse(updated.recurringPattern) : null,
      isRecurring: Boolean(updated.isRecurring),
      isActive: Boolean(updated.isActive)
    });
  } catch (error) {
    console.error('Error updating maintenance window:', error);
    res.status(500).json({ error: 'Error al actualizar ventana de mantenimiento', message: error.message });
  }
});

// Delete maintenance window
router.delete('/:id', async (req, res) => {
  try {
    const windowId = parseInt(req.params.id);
    
    const [existing] = await db.select().from(maintenanceWindows).where(eq(maintenanceWindows.id, windowId));
    
    if (!existing) {
      return res.status(404).json({ error: 'Ventana de mantenimiento no encontrada' });
    }
    
    await db.delete(maintenanceWindows).where(eq(maintenanceWindows.id, windowId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting maintenance window:', error);
    res.status(500).json({ error: 'Error al eliminar ventana de mantenimiento', message: error.message });
  }
});

// Check if a service is currently in maintenance
router.get('/check/:serviceId', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const now = new Date().toISOString();
    
    const activeWindows = await db.select()
      .from(maintenanceWindows)
      .where(
        and(
          eq(maintenanceWindows.serviceId, serviceId),
          eq(maintenanceWindows.isActive, true),
          lte(maintenanceWindows.startTime, now),
          gte(maintenanceWindows.endTime, now)
        )
      );
    
    res.json({
      inMaintenance: activeWindows.length > 0,
      windows: activeWindows.map(w => ({
        ...w,
        recurringPattern: w.recurringPattern ? JSON.parse(w.recurringPattern) : null,
        isRecurring: Boolean(w.isRecurring),
        isActive: Boolean(w.isActive)
      }))
    });
  } catch (error) {
    console.error('Error checking maintenance status:', error);
    res.status(500).json({ error: 'Error al verificar estado de mantenimiento', message: error.message });
  }
});

export default router;
