const request = require('supertest');
const express = require('express');
const flagRoutes = require('../../src/routes/flags');

jest.mock('../../src/models/FeatureFlag');
jest.mock('../../src/services/cacheService');

const FeatureFlag = require('../../src/models/FeatureFlag');
const cacheService = require('../../src/services/cacheService');

const app = express();
app.use(express.json());
app.use('/api/flags', flagRoutes);

describe('Flag API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/flags', () => {
    test('returns all flags', async () => {
      const mockFlags = [
        { id: '1', key: 'flag1', name: 'Flag 1', enabled: true },
        { id: '2', key: 'flag2', name: 'Flag 2', enabled: false }
      ];
      cacheService.getCachedAllFlags.mockResolvedValue(null);
      FeatureFlag.findAll.mockResolvedValue(mockFlags);
      cacheService.setCachedAllFlags.mockResolvedValue();

      const response = await request(app).get('/api/flags');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockFlags);
    });

    test('returns cached flags when available', async () => {
      const mockFlags = [{ id: '1', key: 'flag1' }];
      cacheService.getCachedAllFlags.mockResolvedValue(mockFlags);

      const response = await request(app).get('/api/flags');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockFlags);
      expect(FeatureFlag.findAll).not.toHaveBeenCalled();
    });

    test('filters by enabled status', async () => {
      const mockFlags = [{ id: '1', key: 'flag1', enabled: true }];
      cacheService.getCachedAllFlags.mockResolvedValue(null);
      FeatureFlag.findAll.mockResolvedValue(mockFlags);

      const response = await request(app).get('/api/flags?enabled=true');

      expect(response.status).toBe(200);
      expect(FeatureFlag.findAll).toHaveBeenCalledWith(true);
    });
  });

  describe('GET /api/flags/:key', () => {
    test('returns flag by key', async () => {
      const mockFlag = { id: '1', key: 'test_flag', name: 'Test Flag' };
      cacheService.getCachedFlag.mockResolvedValue(null);
      FeatureFlag.findByKey.mockResolvedValue(mockFlag);
      cacheService.setCachedFlag.mockResolvedValue();

      const response = await request(app).get('/api/flags/test_flag');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockFlag);
    });

    test('returns 404 when flag not found', async () => {
      cacheService.getCachedFlag.mockResolvedValue(null);
      FeatureFlag.findByKey.mockResolvedValue(null);

      const response = await request(app).get('/api/flags/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/flags', () => {
    test('creates new flag', async () => {
      const newFlag = {
        key: 'new_flag',
        name: 'New Flag',
        description: 'Test',
        enabled: true,
        rollout_percentage: 50
      };
      const createdFlag = { id: '1', ...newFlag };
      FeatureFlag.create.mockResolvedValue(createdFlag);
      cacheService.invalidateAllFlags.mockResolvedValue();

      const response = await request(app).post('/api/flags').send(newFlag);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(createdFlag);
    });

    test('validates required fields', async () => {
      const response = await request(app).post('/api/flags').send({});

      expect(response.status).toBe(400);
    });

    test('validates rollout percentage range', async () => {
      const response = await request(app).post('/api/flags').send({
        key: 'test',
        name: 'Test',
        rollout_percentage: 150
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/flags/:key', () => {
    test('updates existing flag', async () => {
      const updates = { name: 'Updated Name', enabled: false };
      const updatedFlag = { id: '1', key: 'test_flag', ...updates };
      FeatureFlag.update.mockResolvedValue(updatedFlag);
      cacheService.invalidateFlag.mockResolvedValue();
      cacheService.invalidateAllFlags.mockResolvedValue();

      const response = await request(app).put('/api/flags/test_flag').send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(updatedFlag);
    });

    test('returns 404 when flag not found', async () => {
      FeatureFlag.update.mockResolvedValue(null);

      const response = await request(app).put('/api/flags/nonexistent').send({ name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/flags/:key', () => {
    test('deletes flag', async () => {
      FeatureFlag.delete.mockResolvedValue(true);
      cacheService.invalidateFlag.mockResolvedValue();
      cacheService.invalidateAllFlags.mockResolvedValue();

      const response = await request(app).delete('/api/flags/test_flag');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });

    test('returns 404 when flag not found', async () => {
      FeatureFlag.delete.mockResolvedValue(false);

      const response = await request(app).delete('/api/flags/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/flags/:key/toggle', () => {
    test('toggles flag state', async () => {
      const toggledFlag = { id: '1', key: 'test_flag', enabled: false };
      FeatureFlag.toggle.mockResolvedValue(toggledFlag);
      cacheService.invalidateFlag.mockResolvedValue();
      cacheService.invalidateAllFlags.mockResolvedValue();

      const response = await request(app).patch('/api/flags/test_flag/toggle');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(toggledFlag);
    });

    test('returns 404 when flag not found', async () => {
      FeatureFlag.toggle.mockResolvedValue(null);

      const response = await request(app).patch('/api/flags/nonexistent/toggle');

      expect(response.status).toBe(404);
    });
  });
});