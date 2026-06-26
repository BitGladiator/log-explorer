import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, getStoredToken, removeStoredToken } from '../api/client';

const AuthContext = createContext(null);


function decodeTokenOptimistic(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const initialToken = getStoredToken();
  const initialPayload = initialToken ? decodeTokenOptimistic(initialToken) : null;

  const [user, setUser] = useState(
    initialPayload ? { id: initialPayload.userId } : null
  );
  
  const [loading, setLoading] = useState(!!initialPayload);

  useEffect(() => {
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