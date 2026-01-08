const { FeatureFlag } = require('../models');
const { evaluateFlag } = require('../services/evaluationService');
const { getCachedFlag, setCachedFlag, getCachedAllFlags, setCachedAllFlags } = require('../services/cacheService');

const evaluate = async (req, res, next) => {
  try {
    const { flagKey, userId, attributes = {} } = req.body;

    if (!flagKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "flagKey" is required'
      });
    }

    let flag = await getCachedFlag(flagKey);
    
    if (!flag) {
      flag = await FeatureFlag.findByKey(flagKey);
      if (flag) {
        await setCachedFlag(flagKey, flag);
      }
    }

    const userContext = { userId, attributes };
    const result = evaluateFlag(flag, userContext);

    res.json({
      success: true,
      flagKey,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const evaluateBulk = async (req, res, next) => {
  try {
    const { flagKeys, userId, attributes = {} } = req.body;

    if (!flagKeys || !Array.isArray(flagKeys) || flagKeys.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "flagKeys" must be a non-empty array'
      });
    }

    if (flagKeys.length > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot evaluate more than 100 flags at once'
      });
    }

    let allFlags = await getCachedAllFlags();
    
    if (!allFlags) {
      const flags = await FeatureFlag.findAll();
      allFlags = flags.reduce((acc, flag) => {
        acc[flag.key] = flag;
        return acc;
      }, {});
      await setCachedAllFlags(allFlags);
    }

    const userContext = { userId, attributes };
    const results = {};

    for (const flagKey of flagKeys) {
      const flag = allFlags[flagKey] || null;
      results[flagKey] = evaluateFlag(flag, userContext);
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    next(error);
  }
};

const getAllFlagsForClient = async (req, res, next) => {
  try {
    const { userId, attributes = {} } = req.body;

    let allFlags = await getCachedAllFlags();
    
    if (!allFlags) {
      const flags = await FeatureFlag.findAll({ enabled: true });
      allFlags = flags.reduce((acc, flag) => {
        acc[flag.key] = flag;
        return acc;
      }, {});
      await setCachedAllFlags(allFlags);
    }

    const userContext = { userId, attributes };
    const results = {};

    for (const [key, flag] of Object.entries(allFlags)) {
      if (flag.enabled) {
        const evaluation = evaluateFlag(flag, userContext);
        results[key] = evaluation.enabled;
      }
    }

    res.json({
      success: true,
      flags: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  evaluate,
  evaluateBulk,
  getAllFlagsForClient,
};