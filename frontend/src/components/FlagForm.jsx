import { useState, useEffect } from 'react';
import { flagService } from '../services/api';

export default function FlagForm({ flag, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    rollout_percentage: 0,
    targeting_rules: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (flag) {
      setFormData({
        key: flag.key,
        name: flag.name,
        description: flag.description || '',
        enabled: flag.enabled,
        rollout_percentage: flag.rollout_percentage,
        targeting_rules: flag.targeting_rules || [],
      });
    }
  }, [flag]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (flag) {
        const { key, ...updates } = formData;
        await flagService.update(flag.key, updates);
      } else {
        await flagService.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save flag');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTargetingRule = () => {
    const newRule = { type: 'user_id', operator: 'in', values: [] };
    setFormData(prev => ({
      ...prev,
      targeting_rules: [...prev.targeting_rules, newRule]
    }));
  };

  const updateTargetingRule = (index, field, value) => {
    const updated = [...formData.targeting_rules];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, targeting_rules: updated }));
  };

  const removeTargetingRule = (index) => {
    setFormData(prev => ({
      ...prev,
      targeting_rules: prev.targeting_rules.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{flag ? 'Edit Flag' : 'Create New Flag'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="flag-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Flag Key *</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => handleChange('key', e.target.value)}
              placeholder="dark_mode"
              pattern="[a-z0-9_]+"
              disabled={!!flag}
              required
            />
            <small>Lowercase letters, numbers, and underscores only</small>
          </div>

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Dark Mode"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enable dark theme across the application"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
              />
              <span>Enabled</span>
            </label>
          </div>

          <div className="form-group">
            <label>Rollout Percentage: {formData.rollout_percentage}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.rollout_percentage}
              onChange={(e) => handleChange('rollout_percentage', parseInt(e.target.value))}
              className="rollout-slider"
            />
            <div className="rollout-marks">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="form-group">
            <div className="section-header">
              <label>Targeting Rules</label>
              <button type="button" onClick={addTargetingRule} className="btn-add-rule">
                + Add Rule
              </button>
            </div>
            
            {formData.targeting_rules.map((rule, index) => (
              <div key={index} className="targeting-rule">
                <select
                  value={rule.type}
                  onChange={(e) => updateTargetingRule(index, 'type', e.target.value)}
                >
                  <option value="user_id">User ID</option>
                  <option value="user_attribute">User Attribute</option>
                </select>

                <select
                  value={rule.operator}
                  onChange={(e) => updateTargetingRule(index, 'operator', e.target.value)}
                >
                  <option value="in">In</option>
                  <option value="not_in">Not In</option>
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                </select>

                {rule.type === 'user_attribute' && (
                  <input
                    type="text"
                    placeholder="Attribute key"
                    value={rule.key || ''}
                    onChange={(e) => updateTargetingRule(index, 'key', e.target.value)}
                  />
                )}

                <input
                  type="text"
                  placeholder="Values (comma-separated)"
                  value={rule.values?.join(',') || rule.value || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (rule.operator.includes('in')) {
                      updateTargetingRule(index, 'values', val.split(',').map(v => v.trim()));
                    } else {
                      updateTargetingRule(index, 'value', val);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => removeTargetingRule(index)}
                  className="btn-remove-rule"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : flag ? 'Update Flag' : 'Create Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}