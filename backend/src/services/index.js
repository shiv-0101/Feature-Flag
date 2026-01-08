const evaluationService = require('./evaluationService');
const cacheService = require('./cacheService');

module.exports = {
  ...evaluationService,
  ...cacheService,
};