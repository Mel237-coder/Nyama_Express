import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;
const listeners = new Map<string, Set<Function>>();

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function connectSocket(): void {
  const { session } = useAuthStore.getState();
  const s = getSocket();
  if (session?.access_token) {
    s.auth = { token: session.access_token };
  }
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  const s = getSocket();
  if (s.connected) {
    s.disconnect();
  }
}

export function joinRoom(room: string): void {
  const s = getSocket();
  s.emit('join_room', room);
}

export function leaveRoom(room: string): void {
  const s = getSocket();
  s.emit('leave_room', room);
}

export function onEvent(event: string, handler: Function): void {
  if (!socket) return;
  socket.on(event, handler as any);
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
}

export function offEvent(event: string, handler: Function): void {
  if (!socket) return;
  socket.off(event, handler as any);
  listeners.get(event)?.delete(handler);
}

export function offAllEvent(event: string): void {
  if (!socket) return;
  const eventListeners = listeners.get(event);
  if (eventListeners) {
    eventListeners.forEach((handler) => socket!.off(event, handler as any));
    eventListeners.clear();
  }
}

export function emitLocationUpdate(driverId: string, lat: number, lng: number): void {
  const s = getSocket();
  s.emit('driver_location_update', { driverId, lat, lng });
}