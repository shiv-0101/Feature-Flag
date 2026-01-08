const { redisClient } = require('../config/redis');

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 60;
const FLAG_PREFIX = 'flag:';
const ALL_FLAGS_KEY = 'flags:all';

const getCachedFlag = async (key) => {
  try {
    if (!redisClient.isOpen) return null;
    const cached = await redisClient.get(`${FLAG_PREFIX}${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
};

const setCachedFlag = async (key, flag) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(`${FLAG_PREFIX}${key}`, CACHE_TTL, JSON.stringify(flag));
  } catch (err) {
    console.error('Redis set error:', err);
  }
};

const getCachedAllFlags = async () => {
  try {
    if (!redisClient.isOpen) return null;
    const cached = await redisClient.get(ALL_FLAGS_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error('Redis get all error:', err);
    return null;
  }
};

const setCachedAllFlags = async (flags) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(ALL_FLAGS_KEY, CACHE_TTL, JSON.stringify(flags));
  } catch (err) {
    console.error('Redis set all error:', err);
  }
};

const invalidateFlag = async (key) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(`${FLAG_PREFIX}${key}`);
    await redisClient.del(ALL_FLAGS_KEY);
  } catch (err) {
    console.error('Redis invalidate error:', err);
  }
};

const invalidateAllFlags = async () => {
  try {
    if (!redisClient.isOpen) return;
    const keys = await redisClient.keys(`${FLAG_PREFIX}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    await redisClient.del(ALL_FLAGS_KEY);
  } catch (err) {
    console.error('Redis invalidate all error:', err);
  }
};

module.exports = {
  getCachedFlag,
  setCachedFlag,
  getCachedAllFlags,
  setCachedAllFlags,
  invalidateFlag,
  invalidateAllFlags,
};