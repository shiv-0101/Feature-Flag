class CacheManager {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expiresAt = Date.now() + this.ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  getAll() {
    const result = {};
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() <= item.expiresAt) {
        result[key] = item.value;
      } else {
        this.cache.delete(key);
      }
    }
    return result;
  }
}

export default CacheManager;