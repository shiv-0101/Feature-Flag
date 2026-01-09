import { useState, useEffect } from 'react';
import { authService } from './services/auth';
import Login from './components/Login';
import FlagList from './components/FlagList';
import FlagForm from './components/FlagForm';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const handleCreateNew = () => {
    setSelectedFlag(null);
    setShowForm(true);
  };

  const handleEdit = (flag) => {
    setSelectedFlag(flag);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedFlag(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedFlag(null);
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🚩 Feature Flag Dashboard</h1>
        <div className="header-actions">
          <button onClick={handleCreateNew} className="btn-create">
            + Create Flag
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="main">
        <FlagList 
          onEdit={handleEdit} 
          onRefresh={refreshTrigger}
        />
      </main>

      {showForm && (
        <FlagForm
          flag={selectedFlag}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default App;
