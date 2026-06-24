import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, getStoredToken, removeStoredToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there is no token stored locally, skip the network call entirely.
    // This is the most common path for unauthenticated users and avoids
    // a cold-start round-trip to the server on every page load.
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => {
        removeStoredToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);