const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('connect', () => console.log('⚡ Connected to Redis'));
redisClient.on('error', (err) => console.error('Redis error:', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
};

module.exports = { redisClient, connectRedis };
