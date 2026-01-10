import { useState, useEffect } from 'react';
import FeatureFlagClient from '@feature-flags/js-sdk';

const client = new FeatureFlagClient({
  apiUrl: 'http://localhost:3001/api',
  userId: 'user_123',
  userAttributes: { role: 'admin' },
  pollInterval: 30000,
});

function useFeatureFlag(flagKey, defaultValue = false) {
  const [isEnabled, setIsEnabled] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.isEnabled(flagKey, defaultValue).then(result => {
      setIsEnabled(result);
      setLoading(false);
    });

    const unsubscribe = client.on('flagsUpdated', (flags) => {
      if (flags[flagKey] !== undefined) {
        setIsEnabled(flags[flagKey]);
      }
    });

    return unsubscribe;
  }, [flagKey, defaultValue]);

  return { isEnabled, loading };
}

function useFeatureFlags() {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.initialize().then(() => {
      setFlags(client.getAllFlags());
      setLoading(false);
    });

    const unsubscribe = client.on('flagsUpdated', (updatedFlags) => {
      setFlags(updatedFlags);
    });

    return () => {
      unsubscribe();
      client.destroy();
    };
  }, []);

  return { flags, loading };
}

function App() {
  const { isEnabled: darkMode, loading: darkModeLoading } = useFeatureFlag('dark_mode');
  const { isEnabled: newFeature } = useFeatureFlag('new_feature');
  const { flags, loading: allLoading } = useFeatureFlags();

  if (allLoading) {
    return <div>Loading feature flags...</div>;
  }

  return (
    <div className={darkMode ? 'dark-theme' : 'light-theme'}>
      <h1>Feature Flags Demo</h1>
      
      {darkModeLoading ? (
        <p>Loading dark mode setting...</p>
      ) : (
        <p>Dark mode is {darkMode ? 'enabled' : 'disabled'}</p>
      )}

      {newFeature && (
        <div className="new-feature">
          <h2>New Feature Available!</h2>
          <p>This content is only visible when the new_feature flag is enabled.</p>
        </div>
      )}

      <div>
        <h3>All Feature Flags:</h3>
        <pre>{JSON.stringify(flags, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;