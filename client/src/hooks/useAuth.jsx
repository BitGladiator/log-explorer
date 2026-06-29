import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, getStoredToken, removeStoredToken } from '../api/client';

const AuthContext = createContext(null);

const ME_CACHE_KEY = 'me_cache';
const PING_INTERVAL_MS = 14 * 60 * 1000; 

function decodeTokenOptimistic(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getCachedMe() {
  try {
    const raw = localStorage.getItem(ME_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedMe(user) {
  try {
    if (user) localStorage.setItem(ME_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(ME_CACHE_KEY);
  } catch {}
}

export const AuthProvider = ({ children }) => {
  const initialToken = getStoredToken();
  const initialPayload = initialToken ? decodeTokenOptimistic(initialToken) : null;


  const cachedUser = initialPayload ? getCachedMe() : null;

  const [user, setUser] = useState(cachedUser ?? (initialPayload ? { id: initialPayload.userId } : null));


  const [loading, setLoading] = useState(!cachedUser && !!initialPayload);

  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }

    getMe()
      .then((freshUser) => {
        setUser(freshUser);
        setCachedMe(freshUser);
      })
      .catch(() => {
        removeStoredToken();
        setCachedMe(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);


  useEffect(() => {
    if (!user) return;

    const BASE_URL = import.meta.env.VITE_API_URL;
    const ping = () =>
      fetch(`${BASE_URL}/api/ping`, { method: 'GET' }).catch(() => {});

    const id = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [!!user]); 

  const setUserAndCache = (u) => {
    setUser(u);
    setCachedMe(u);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: setUserAndCache, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);