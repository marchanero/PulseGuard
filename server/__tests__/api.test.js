/**
 * Tests para la API de PulseGuard
 * Ejemplo de testing de API con Supertest
 */
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Crear app de Express para testing
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mock de rutas básicas
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/services', (req, res) => {
    res.json([
      { id: 1, name: 'Service 1', status: 'up' },
      { id: 2, name: 'Service 2', status: 'down' }
    ]);
  });

  app.get('/api/services/:id', (req, res) => {
    const { id } = req.params;
    res.json({ id: parseInt(id), name: `Service ${id}`, status: 'up' });
  });

  app.post('/api/services', (req, res) => {
    const { name, url } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    res.status(201).json({ id: 3, name, url, status: 'up' });
  });

  app.put('/api/services/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    res.json({ id: parseInt(id), ...updates });
  });

  app.delete('/api/services/:id', (req, res) => {
    res.status(204).send();
  });

  return app;
};

describe('API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/services', () => {
    it('should return list of services', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('GET /api/services/:id', () => {
    it('should return a specific service', async () => {
      const response = await request(app)
        .get('/api/services/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('POST /api/services', () => {
    it('should create a new service', async () => {
      const newService = {
        name: 'New Service',
        url: 'https://example.com'
      };

      const response = await request(app)
        .post('/api/services')
        .send(newService)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newService.name);
      expect(response.body).toHaveProperty('url', newService.url);
      expect(response.body).toHaveProperty('status');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({ url: 'https://example.com' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if url is missing', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({ name: 'New Service' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/services/:id', () => {
    it('should update an existing service', async () => {
      const updates = { name: 'Updated Service', status: 'down' };

      const response = await request(app)
        .put('/api/services/1')
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name', updates.name);
      expect(response.body).toHaveProperty('status', updates.status);
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete a service', async () => {
      await request(app)
        .delete('/api/services/1')
        .expect(204);
    });
  });
});