import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

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
  const {
    queueId,
    onTokenJoined,
    onTokenServing,
    onTokenCompleted,
    onTokenMissed,
    onNewMessage,
  } = options;

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      if (queueId) {
        socket.emit('joinQueueRoom', queueId);
      }
    });

    if (onTokenJoined) socket.on('token_joined', onTokenJoined);
    if (onTokenServing) socket.on('token_serving', onTokenServing);
    if (onTokenCompleted) socket.on('token_completed', onTokenCompleted);
    if (onTokenMissed) socket.on('token_missed', onTokenMissed);
    if (onNewMessage) socket.on('new_message', onNewMessage);

    return () => {
      socket.off('token_joined', onTokenJoined);
      socket.off('token_serving', onTokenServing);
      socket.off('token_completed', onTokenCompleted);
      socket.off('token_missed', onTokenMissed);
      socket.off('new_message', onNewMessage);
      socket.disconnect();
    };
  }, [queueId, onTokenJoined, onTokenServing, onTokenCompleted, onTokenMissed, onNewMessage]);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('joinQueueRoom', roomId);
    }
  }, []);

  return { socket: socketRef.current, joinRoom };
}
