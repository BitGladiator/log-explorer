import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const useLogStream = (projectId, isLive) => {
  const [streamedLogs, setStreamedLogs] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    socketRef.current = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
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
      if (!isLive) return; 
      setStreamedLogs((prev) => [...logs.reverse(), ...prev].slice(0, 500));
    });

    return () => {
      socketRef.current?.emit('unsubscribe', projectId);
      socketRef.current?.disconnect();
    };
  }, [projectId, isLive]);

  const clearStream = useCallback(() => setStreamedLogs([]), []);

  return { streamedLogs, clearStream };
};

export default useLogStream;