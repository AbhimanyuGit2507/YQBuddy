import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

interface UseQueueSocketOptions {
  queueId?: string;
  onTokenJoined?: () => void;
  onTokenServing?: () => void;
  onTokenCompleted?: () => void;
  onTokenMissed?: () => void;
  onNewMessage?: () => void;
}

export function useQueueSocket(options: UseQueueSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queueIdRef = useRef(options.queueId);
  const {
    onTokenJoined,
    onTokenServing,
    onTokenCompleted,
    onTokenMissed,
    onNewMessage,
  } = options;

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: BASE_RECONNECT_DELAY,
      reconnectionDelayMax: MAX_RECONNECT_DELAY,
      randomizationFactor: 0.5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      reconnectAttemptsRef.current = 0;
      if (queueIdRef.current) {
        socket.emit('joinQueueRoom', queueIdRef.current);
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect' || reason === 'transport close') {
        const delay = Math.min(
          BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY,
        );
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          socket.connect();
        }, delay);
      }
    });

    socket.on('connect_error', () => {
      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
        MAX_RECONNECT_DELAY,
      );
      reconnectAttemptsRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        socket.connect();
      }, delay);
    });

    if (onTokenJoined) socket.on('token_joined', onTokenJoined);
    if (onTokenServing) socket.on('token_serving', onTokenServing);
    if (onTokenCompleted) socket.on('token_completed', onTokenCompleted);
    if (onTokenMissed) socket.on('token_missed', onTokenMissed);
    if (onNewMessage) socket.on('new_message', onNewMessage);

    return socket;
  }, [onTokenJoined, onTokenServing, onTokenCompleted, onTokenMissed, onNewMessage]);

  useEffect(() => {
    queueIdRef.current = options.queueId;
    const socket = connect();

    return () => {
      clearReconnectTimer();
      if (socket) {
        socket.off('token_joined', onTokenJoined);
        socket.off('token_serving', onTokenServing);
        socket.off('token_completed', onTokenCompleted);
        socket.off('token_missed', onTokenMissed);
        socket.off('new_message', onNewMessage);
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [connect, options.queueId, onTokenJoined, onTokenServing, onTokenCompleted, onTokenMissed, onNewMessage]);

  const joinRoom = useCallback((roomId: string) => {
    queueIdRef.current = roomId;
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinQueueRoom', roomId);
    }
  }, []);

  return { socket: socketRef.current, joinRoom };
}