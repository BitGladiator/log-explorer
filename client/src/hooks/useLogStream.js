import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getStoredToken } from '../api/client';

const useLogStream = (projectId, isLive) => {
  const [streamedLogs, setStreamedLogs] = useState([]);
  const socketRef = useRef(null);
  // Use a ref so the socket event handler always reads the latest value
  // without needing isLive in the dependency array (which would cause a
  // full disconnect/reconnect every time the user toggles live mode).
  const isLiveRef = useRef(isLive);
  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    if (!projectId) return;

    socketRef.current = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      auth: { token: getStoredToken() },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('subscribe', projectId);
    });

    socketRef.current.on('new_logs', (logs) => {
      if (!isLiveRef.current) return;
      setStreamedLogs((prev) => [...logs.reverse(), ...prev].slice(0, 500));
    });

    return () => {
      socketRef.current?.emit('unsubscribe', projectId);
      socketRef.current?.disconnect();
    };
  }, [projectId]); // isLive intentionally excluded — read via ref above

  const clearStream = useCallback(() => setStreamedLogs([]), []);

  return { streamedLogs, clearStream };
};

export default useLogStream;