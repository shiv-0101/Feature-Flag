const { getClient } = require('../config/redis');

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 60;
const FLAG_PREFIX = 'flag:';
const ALL_FLAGS_KEY = 'flags:all';

/**
 * Check if Redis is available
 */
const isRedisAvailable = () => {
  const client = getClient();
  return client && client.isOpen;
};

const getCachedFlag = async (key) => {
  try {
    if (!isRedisAvailable()) return null;
    const client = getClient();
    const cached = await client.get(`${FLAG_PREFIX}${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error('Redis get error:', err.message);
    return null;
  }
};

const setCachedFlag = async (key, flag) => {
  try {
    if (!isRedisAvailable()) return;
    const client = getClient();
    await client.setEx(`${FLAG_PREFIX}${key}`, CACHE_TTL, JSON.stringify(flag));
  } catch (err) {
    console.error('Redis set error:', err.message);
  }
};

const getCachedAllFlags = async () => {
  try {
    if (!isRedisAvailable()) return null;
    const client = getClient();
    const cached = await client.get(ALL_FLAGS_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error('Redis get all error:', err.message);
    return null;
  }
};

const setCachedAllFlags = async (flags) => {
  try {
    if (!isRedisAvailable()) return;
    const client = getClient();
    await client.setEx(ALL_FLAGS_KEY, CACHE_TTL, JSON.stringify(flags));
  } catch (err) {
    console.error('Redis set all error:', err.message);
  }
};

const invalidateFlag = async (key) => {
  try {
    if (!isRedisAvailable()) return;
    const client = getClient();
    await client.del(`${FLAG_PREFIX}${key}`);
    await client.del(ALL_FLAGS_KEY);
  } catch (err) {
    console.error('Redis invalidate error:', err.message);
  }
};

const invalidateAllFlags = async () => {
  try {
    if (!isRedisAvailable()) return;
    const client = getClient();
    const keys = await client.keys(`${FLAG_PREFIX}*`);
    if (keys.length > 0) {
      await client.del(keys);
    }
    await client.del(ALL_FLAGS_KEY);
  } catch (err) {
    console.error('Redis invalidate all error:', err.message);
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