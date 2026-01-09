import { useState, useEffect } from 'react';
import { flagService } from '../services/api';

export default function FlagList({ onEdit, onRefresh }) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFlags();
  }, [filter]);

  useEffect(() => {
    if (onRefresh) {
      loadFlags();
    }
  }, [onRefresh]);

  const loadFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      const filterEnabled = filter === 'enabled' ? true : filter === 'disabled' ? false : undefined;
      const result = await flagService.getAll(filterEnabled);
      setFlags(result.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    try {
      await flagService.toggle(key);
      loadFlags();
    } catch (err) {
      alert('Failed to toggle flag');
    }
  };

  const handleDelete = async (key) => {
    if (!confirm(`Delete flag "${key}"?`)) return;
    try {
      await flagService.delete(key);
      loadFlags();
    } catch (err) {
      alert('Failed to delete flag');
    }
  };

  const filteredFlags = flags.filter(flag => 
    flag.key.toLowerCase().includes(search.toLowerCase()) ||
    flag.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading flags...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="flag-list">
      <div className="list-controls">
        <input
          type="text"
          placeholder="Search flags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'enabled' ? 'active' : ''} 
            onClick={() => setFilter('enabled')}
          >
            Enabled
          </button>
          <button 
            className={filter === 'disabled' ? 'active' : ''} 
            onClick={() => setFilter('disabled')}
          >
            Disabled
          </button>
        </div>
      </div>

      <div className="flags-grid">
        {filteredFlags.length === 0 ? (
          <div className="no-flags">No flags found</div>
        ) : (
          filteredFlags.map((flag) => (
            <div key={flag.id} className="flag-card">
              <div className="flag-header">
                <div>
                  <h3>{flag.name}</h3>
                  <code className="flag-key">{flag.key}</code>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    onChange={() => handleToggle(flag.key)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              {flag.description && (
                <p className="flag-description">{flag.description}</p>
              )}
              
              <div className="flag-stats">
                <div className="stat">
                  <span className="stat-label">Rollout:</span>
                  <span className="stat-value">{flag.rollout_percentage}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Rules:</span>
                  <span className="stat-value">{flag.targeting_rules?.length || 0}</span>
                </div>
              </div>
              
              <div className="flag-actions">
                <button onClick={() => onEdit(flag)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(flag.key)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}