import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getMe, getStoredToken, removeStoredToken } from "../api/client";

const AuthContext = createContext(null);

const ME_CACHE_KEY = "me_cache";

const PING_INTERVAL_MS = 13 * 60 * 1000;

const MAX_RETRIES = 5;

const BASE_RETRY_DELAY_MS = 2000;

function decodeTokenOptimistic(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
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

function isAuthError(err) {
  if (err && err.isNetworkError === false) {
    return err.status === 401 || err.status === 403;
  }

  return false;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BASE_URL = import.meta.env.VITE_API_URL;

let _pingInterval = null;

function startGlobalPing() {
  if (_pingInterval) return;
  const ping = () =>
    fetch(`${BASE_URL}/api/ping`, { method: "GET" }).catch(() => {});
  ping();
  _pingInterval = setInterval(ping, PING_INTERVAL_MS);
}

startGlobalPing();

export const AuthProvider = ({ children }) => {
  const initialToken = getStoredToken();
  const initialPayload = initialToken
    ? decodeTokenOptimistic(initialToken)
    : null;
  const cachedUser = initialPayload ? getCachedMe() : null;

  const [user, setUser] = useState(
    cachedUser ?? (initialPayload ? { id: initialPayload.userId } : null),
  );

  const [loading, setLoading] = useState(!cachedUser && !!initialPayload);

  const [wakingUp, setWakingUp] = useState(false);

  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;

    if (!getStoredToken()) {
      setLoading(false);
      return;
    }

    const verifySession = async () => {
      let attempt = 0;

      while (attempt <= MAX_RETRIES) {
        if (cancelRef.current) return;

        try {
          const freshUser = await getMe();
          if (cancelRef.current) return;
          setUser(freshUser);
          setCachedMe(freshUser);
          setWakingUp(false);
          setLoading(false);
          return;
        } catch (err) {
          if (cancelRef.current) return;

          if (isAuthError(err)) {
            removeStoredToken();
            setCachedMe(null);
            setUser(null);
            setWakingUp(false);
            setLoading(false);
            return;
          }

          attempt += 1;
          if (attempt > MAX_RETRIES) break;

          setWakingUp(true);

          const delay = Math.min(
            BASE_RETRY_DELAY_MS * 2 ** (attempt - 1),
            30_000,
          );
          await sleep(delay);
        }
      }

      if (!cancelRef.current) {
        setWakingUp(false);
        setLoading(false);

        if (!getCachedMe()) {
        }
      }
    };

    verifySession();

    return () => {
      cancelRef.current = true;
    };
  }, []);

  const setUserAndCache = (u) => {
    setUser(u);
    setCachedMe(u);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser: setUserAndCache, loading, wakingUp }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
