import axios from 'axios';
import CacheManager from './cache.js';
import EventEmitter from './events.js';

class FeatureFlagClient extends EventEmitter {
  constructor(config) {
    super();
    this.apiUrl = config.apiUrl || 'http://localhost:3001/api';
    this.userId = config.userId;
    this.userAttributes = config.userAttributes || {};
    this.pollInterval = config.pollInterval || 30000;
    this.enableCache = config.enableCache !== false;
    this.cacheTTL = config.cacheTTL || 60000;
    
    this.cache = new CacheManager(this.cacheTTL);
    this.isPolling = false;
    this.pollTimer = null;
    this.flags = {};

    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async initialize() {
    try {
      await this.fetchAllFlags();
      if (this.pollInterval > 0) {
        this.startPolling();
      }
      this.emit('ready', this.flags);
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async fetchAllFlags() {
    const cacheKey = `all_flags_${this.userId}`;
    
    if (this.enableCache && this.cache.has(cacheKey)) {
      this.flags = this.cache.get(cacheKey);
      return this.flags;
    }

    try {
      const response = await this.api.post('/evaluate/all', {
        userId: this.userId,
        attributes: this.userAttributes,
      });

      this.flags = response.data.data || {};
      
      if (this.enableCache) {
        this.cache.set(cacheKey, this.flags);
      }

      this.emit('flagsUpdated', this.flags);
      return this.flags;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async isEnabled(flagKey, defaultValue = false) {
    if (this.flags[flagKey] !== undefined) {
      return this.flags[flagKey];
    }

    const cacheKey = `flag_${flagKey}_${this.userId}`;
    
    if (this.enableCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.api.post('/evaluate', {
        flagKey,
        userId: this.userId,
        attributes: this.userAttributes,
      });

      const result = response.data.data?.result ?? defaultValue;
      
      if (this.enableCache) {
        this.cache.set(cacheKey, result);
      }

      this.flags[flagKey] = result;
      return result;
    } catch (error) {
      this.emit('error', error);
      return defaultValue;
    }
  }

  async evaluateFlags(flagKeys) {
    const cacheKey = `bulk_${flagKeys.join(',')}_${this.userId}`;
    
    if (this.enableCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.api.post('/evaluate/bulk', {
        flagKeys,
        userId: this.userId,
        attributes: this.userAttributes,
      });

      const results = response.data.data || {};
      
      if (this.enableCache) {
        this.cache.set(cacheKey, results);
      }

      Object.assign(this.flags, results);
      return results;
    } catch (error) {
      this.emit('error', error);
      return {};
    }
  }

  getAllFlags() {
    return { ...this.flags };
  }

  updateUser(userId, attributes = {}) {
    this.userId = userId;
    this.userAttributes = attributes;
    this.cache.clear();
    return this.fetchAllFlags();
  }

  updateUserAttributes(attributes) {
    this.userAttributes = { ...this.userAttributes, ...attributes };
    this.cache.clear();
    return this.fetchAllFlags();
  }

  startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollTimer = setInterval(() => {
      this.fetchAllFlags().catch(error => {
        this.emit('error', error);
      });
    }, this.pollInterval);
  }

  stopPolling() {
    if (!this.isPolling) return;
    
    this.isPolling = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  clearCache() {
    this.cache.clear();
  }

  destroy() {
    this.stopPolling();
    this.clearCache();
    this.flags = {};
    this.events = {};
  }
}

export default FeatureFlagClient;