const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ Redis URL not configured - caching disabled');
    return;
  }
  
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on('connect', () => {
      console.log('⚡ Connected to Redis');
      isConnected = true;
    });
    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      isConnected = false;
    });

    await redisClient.connect();
  } catch (err) {
    console.log('⚠️ Redis not available - caching disabled');
    redisClient = null;
  }
};

const getClient = () => (isConnected ? redisClient : null);

module.exports = { redisClient, connectRedis, getClient };
