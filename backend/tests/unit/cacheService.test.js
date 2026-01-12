const { getCachedFlag, setCachedFlag, invalidateFlag, getCachedAllFlags } = require('../../src/services/cacheService');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/config/redis', () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  isOpen: true,
}));

describe('cacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCachedFlag', () => {
    test('returns parsed flag when cache hit', async () => {
      const mockFlag = { key: 'test_flag', enabled: true };
      redisClient.get.mockResolvedValue(JSON.stringify(mockFlag));

      const result = await getCachedFlag('test_flag');
      expect(result).toEqual(mockFlag);
      expect(redisClient.get).toHaveBeenCalledWith('flag:test_flag');
    });

    test('returns null when cache miss', async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await getCachedFlag('test_flag');
      expect(result).toBeNull();
    });

    test('returns null on redis error', async () => {
      redisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await getCachedFlag('test_flag');
      expect(result).toBeNull();
    });
  });

  describe('setCachedFlag', () => {
    test('caches flag with TTL', async () => {
      const mockFlag = { key: 'test_flag', enabled: true };
      redisClient.setEx.mockResolvedValue('OK');

      await setCachedFlag('test_flag', mockFlag);
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'flag:test_flag',
        60,
        JSON.stringify(mockFlag)
      );
    });

    test('handles redis error gracefully', async () => {
      redisClient.setEx.mockRejectedValue(new Error('Redis error'));

      await expect(setCachedFlag('test_flag', {})).resolves.not.toThrow();
    });
  });

  describe('invalidateFlag', () => {
    test('deletes flag from cache', async () => {
      redisClient.del.mockResolvedValue(1);

      await invalidateFlag('test_flag');
      expect(redisClient.del).toHaveBeenCalledWith('flag:test_flag');
    });

    test('handles redis error gracefully', async () => {
      redisClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(invalidateFlag('test_flag')).resolves.not.toThrow();
    });
  });

  describe('getCachedAllFlags', () => {
    test('returns parsed flags when cache hit', async () => {
      const mockFlags = [{ key: 'flag1' }, { key: 'flag2' }];
      redisClient.get.mockResolvedValue(JSON.stringify(mockFlags));

      const result = await getCachedAllFlags();
      expect(result).toEqual(mockFlags);
      expect(redisClient.get).toHaveBeenCalledWith('flags:all');
    });

    test('returns null when cache miss', async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await getCachedAllFlags();
      expect(result).toBeNull();
    });
  });
});