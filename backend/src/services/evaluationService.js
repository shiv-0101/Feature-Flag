const crypto = require('crypto');

const hashUserForRollout = (userId, flagKey) => {
  const combined = `${flagKey}:${userId}`;
  const hash = crypto.createHash('md5').update(combined).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return hashInt % 100;
};

const evaluateTargetingRules = (rules, userContext) => {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    const match = evaluateSingleRule(rule, userContext);
    if (match === true) return true;
    if (match === false) continue;
  }

  return null;
};

const evaluateSingleRule = (rule, userContext) => {
  const { type, operator, key, value, values } = rule;

  if (type === 'user_id') {
    const userId = userContext.userId;
    if (!userId) return false;

    switch (operator) {
      case 'in':
        return values?.includes(userId);
      case 'not_in':
        return !values?.includes(userId);
      case 'equals':
        return userId === value;
      case 'not_equals':
        return userId !== value;
      default:
        return false;
    }
  }

  if (type === 'user_attribute') {
    const attrValue = userContext.attributes?.[key];
    if (attrValue === undefined) return false;

    switch (operator) {
      case 'equals':
        return attrValue === value;
      case 'not_equals':
        return attrValue !== value;
      case 'in':
        return values?.includes(attrValue);
      case 'not_in':
        return !values?.includes(attrValue);
      case 'contains':
        return String(attrValue).includes(value);
      case 'starts_with':
        return String(attrValue).startsWith(value);
      case 'ends_with':
        return String(attrValue).endsWith(value);
      case 'greater_than':
        return Number(attrValue) > Number(value);
      case 'less_than':
        return Number(attrValue) < Number(value);
      case 'regex':
        try {
          return new RegExp(value).test(String(attrValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  if (type === 'percentage') {
    const userId = userContext.userId;
    if (!userId) return false;
    const bucket = hashUserForRollout(userId, userContext._flagKey || 'default');
    return bucket < (value || 0);
  }

  return false;
};

const evaluateFlag = (flag, userContext) => {
  if (!flag) {
    return { enabled: false, reason: 'FLAG_NOT_FOUND' };
  }

  if (!flag.enabled) {
    return { enabled: false, reason: 'FLAG_DISABLED' };
  }

  const enrichedContext = { ...userContext, _flagKey: flag.key };

  const targetingResult = evaluateTargetingRules(flag.targeting_rules, enrichedContext);
  
  if (targetingResult === true) {
    return { enabled: true, reason: 'TARGETING_MATCH' };
  }

  if (targetingResult === false) {
    return { enabled: false, reason: 'TARGETING_NO_MATCH' };
  }

  if (flag.rollout_percentage > 0 && userContext.userId) {
    const bucket = hashUserForRollout(userContext.userId, flag.key);
    const enabled = bucket < flag.rollout_percentage;
    return { 
      enabled, 
      reason: enabled ? 'ROLLOUT_INCLUDED' : 'ROLLOUT_EXCLUDED',
      bucket 
    };
  }

  if (flag.rollout_percentage === 100) {
    return { enabled: true, reason: 'ROLLOUT_FULL' };
  }

  if (flag.rollout_percentage === 0) {
    return { enabled: false, reason: 'ROLLOUT_ZERO' };
  }

  return { enabled: false, reason: 'NO_USER_CONTEXT' };
};

module.exports = {
  hashUserForRollout,
  evaluateTargetingRules,
  evaluateFlag,
};