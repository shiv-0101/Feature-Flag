const request = require('supertest');
const express = require('express');
const evaluateRoutes = require('../../src/routes/evaluate');

jest.mock('../../src/models/FeatureFlag');
jest.mock('../../src/services/evaluationService');
jest.mock('../../src/services/cacheService');

const FeatureFlag = require('../../src/models/FeatureFlag');
const evaluationService = require('../../src/services/evaluationService');
const cacheService = require('../../src/services/cacheService');

const app = express();
app.use(express.json());
app.use('/api/evaluate', evaluateRoutes);

describe('Evaluation API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/evaluate', () => {
    test('evaluates single flag', async () => {
      const mockFlag = { key: 'test_flag', enabled: true, rollout_percentage: 100 };
      FeatureFlag.findByKey.mockResolvedValue(mockFlag);
      evaluationService.evaluateFlag.mockReturnValue(true);

      const response = await request(app)
        .post('/api/evaluate')
        .send({ flagKey: 'test_flag', userId: 'user_123' });

      expect(response.status).toBe(200);
      expect(response.body.data.result).toBe(true);
      expect(response.body.data.flagKey).toBe('test_flag');
    });

    test('returns false when flag not found', async () => {
      FeatureFlag.findByKey.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/evaluate')
        .send({ flagKey: 'nonexistent', userId: 'user_123' });

      expect(response.status).toBe(200);
      expect(response.body.data.result).toBe(false);
    });

    test('validates required fields', async () => {
      const response = await request(app).post('/api/evaluate').send({});

      expect(response.status).toBe(400);
    });

    test('uses user attributes in evaluation', async () => {
      const mockFlag = { key: 'test_flag', enabled: true };
      const attributes = { role: 'admin', plan: 'premium' };
      FeatureFlag.findByKey.mockResolvedValue(mockFlag);
      evaluationService.evaluateFlag.mockReturnValue(true);

      const response = await request(app)
        .post('/api/evaluate')
        .send({ flagKey: 'test_flag', userId: 'user_123', attributes });

      expect(response.status).toBe(200);
      expect(evaluationService.evaluateFlag).toHaveBeenCalledWith(
        mockFlag,
        'user_123',
        attributes
      );
    });
  });

  describe('POST /api/evaluate/bulk', () => {
    test('evaluates multiple flags', async () => {
      const mockFlags = [
        { key: 'flag1', enabled: true },
        { key: 'flag2', enabled: false }
      ];
      FeatureFlag.findByKey.mockResolvedValueOnce(mockFlags[0]).mockResolvedValueOnce(mockFlags[1]);
      evaluationService.evaluateFlag.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const response = await request(app)
        .post('/api/evaluate/bulk')
        .send({ flagKeys: ['flag1', 'flag2'], userId: 'user_123' });

      expect(response.status).toBe(200);
      expect(response.body.data.flag1).toBe(true);
      expect(response.body.data.flag2).toBe(false);
    });

    test('validates flagKeys array', async () => {
      const response = await request(app)
        .post('/api/evaluate/bulk')
        .send({ flagKeys: 'not_an_array', userId: 'user_123' });

      expect(response.status).toBe(400);
    });

    test('limits bulk evaluation to 100 flags', async () => {
      const flagKeys = Array(101).fill('flag');

      const response = await request(app)
        .post('/api/evaluate/bulk')
        .send({ flagKeys, userId: 'user_123' });

      expect(response.status).toBe(400);
    });

    test('handles non-existent flags gracefully', async () => {
      FeatureFlag.findByKey.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/evaluate/bulk')
        .send({ flagKeys: ['nonexistent'], userId: 'user_123' });

      expect(response.status).toBe(200);
      expect(response.body.data.nonexistent).toBe(false);
    });
  });

  describe('POST /api/evaluate/all', () => {
    test('evaluates all enabled flags', async () => {
      const mockFlags = [
        { key: 'flag1', enabled: true },
        { key: 'flag2', enabled: true }
      ];
      FeatureFlag.findAll.mockResolvedValue(mockFlags);
      evaluationService.evaluateFlag.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const response = await request(app)
        .post('/api/evaluate/all')
        .send({ userId: 'user_123' });

      expect(response.status).toBe(200);
      expect(response.body.data.flag1).toBe(true);
      expect(response.body.data.flag2).toBe(false);
    });

    test('returns empty object when no flags', async () => {
      FeatureFlag.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/evaluate/all')
        .send({ userId: 'user_123' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({});
    });

    test('validates userId is required', async () => {
      const response = await request(app).post('/api/evaluate/all').send({});

      expect(response.status).toBe(400);
    });
  });
});