const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
};

const validateFlag = (req, res, next) => {
  const { key, name, enabled, rollout_percentage, targeting_rules } = req.body;
  const errors = [];

  if (req.method === 'POST') {
    if (!key || typeof key !== 'string' || key.trim() === '') {
      errors.push('Field "key" is required and must be a non-empty string');
    } else if (!/^[a-z0-9_]+$/.test(key)) {
      errors.push('Field "key" must contain only lowercase letters, numbers, and underscores');
    } else if (key.length > 100) {
      errors.push('Field "key" must not exceed 100 characters');
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('Field "name" is required and must be a non-empty string');
    } else if (name.length > 255) {
      errors.push('Field "name" must not exceed 255 characters');
    }
  }
  
  if (req.body.name) req.body.name = sanitizeString(req.body.name);
  if (req.body.description) req.body.description = sanitizeString(req.body.description);

  if (enabled !== undefined && typeof enabled !== 'boolean') {
    errors.push('Field "enabled" must be a boolean');
  }

  if (rollout_percentage !== undefined) {
    if (typeof rollout_percentage !== 'number') {
      errors.push('Field "rollout_percentage" must be a number');
    } else if (rollout_percentage < 0 || rollout_percentage > 100) {
      errors.push('Field "rollout_percentage" must be between 0 and 100');
    }
  }

  if (targeting_rules !== undefined) {
    if (!Array.isArray(targeting_rules)) {
      errors.push('Field "targeting_rules" must be an array');
    } else if (targeting_rules.length > 50) {
      errors.push('Field "targeting_rules" cannot exceed 50 rules');
    } else {
      targeting_rules.forEach((rule, index) => {
        if (!rule.type || typeof rule.type !== 'string') {
          errors.push(`targeting_rules[${index}]: "type" is required and must be a string`);
        }
        if (!rule.operator || typeof rule.operator !== 'string') {
          errors.push(`targeting_rules[${index}]: "operator" is required and must be a string`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors
    });
  }

  next();
};

const validateFlagKey = (req, res, next) => {
  const { key } = req.params;

  if (!key || typeof key !== 'string' || key.trim() === '') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid flag key parameter'
    });
  }

  if (!/^[a-z0-9_]+$/.test(key)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Flag key must contain only lowercase letters, numbers, and underscores'
    });
  }

  next();
};

module.exports = { validateFlag, validateFlagKey, sanitizeString };
