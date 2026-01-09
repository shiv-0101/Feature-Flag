import { useState } from 'react';
import { authService } from '../services/auth';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authService.login(password)) {
      onLogin();
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🚩 Feature Flags</h1>
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Login
          </button>
        </form>
        <p className="hint">Hint: admin123</p>
      </div>
    </div>
  );
}