const { FeatureFlag } = require('../models');

const createFlag = async (req, res, next) => {
  try {
    const { key, name, description, enabled, rollout_percentage, targeting_rules } = req.body;

    const exists = await FeatureFlag.exists(key);
    if (exists) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Flag with key '${key}' already exists`
      });
    }

    const flag = await FeatureFlag.create({
      key, name, description, enabled, rollout_percentage, targeting_rules
    });

    res.status(201).json({ success: true, data: flag });
  } catch (error) {
    next(error);
  }
};

const getAllFlags = async (req, res, next) => {
  try {
    const { enabled } = req.query;
    
    const filters = {};
    if (enabled !== undefined) {
      filters.enabled = enabled === 'true';
    }

    const flags = await FeatureFlag.findAll(filters);

    res.json({ success: true, count: flags.length, data: flags });
  } catch (error) {
    next(error);
  }
};

const getFlagByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const flag = await FeatureFlag.findByKey(key);

    if (!flag) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Flag with key '${key}' not found`
      });
    }

    res.json({ success: true, data: flag });
  } catch (error) {
    next(error);
  }
};

const updateFlag = async (req, res, next) => {
  try {
    const { key } = req.params;
    const updates = req.body;

    delete updates.key;
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    const flag = await FeatureFlag.update(key, updates);

    if (!flag) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Flag with key '${key}' not found`
      });
    }

    res.json({ success: true, data: flag });
  } catch (error) {
    next(error);
  }
};

const deleteFlag = async (req, res, next) => {
  try {
    const { key } = req.params;
    const deleted = await FeatureFlag.delete(key);

    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Flag with key '${key}' not found`
      });
    }

    res.json({ success: true, message: `Flag '${key}' deleted successfully` });
  } catch (error) {
    next(error);
  }
};

const toggleFlag = async (req, res, next) => {
  try {
    const { key } = req.params;
    const flag = await FeatureFlag.toggle(key);

    if (!flag) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Flag with key '${key}' not found`
      });
    }

    res.json({
      success: true,
      data: flag,
      message: `Flag '${key}' ${flag.enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFlag,
  getAllFlags,
  getFlagByKey,
  updateFlag,
  deleteFlag,
  toggleFlag,
};
