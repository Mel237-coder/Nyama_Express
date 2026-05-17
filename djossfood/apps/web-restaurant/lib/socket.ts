import { io, type Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

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

export async function connectSocket(): Promise<void> {
  const { createBrowserSupabaseClient } = await import('@/lib/supabase/client');
  const supabase = createBrowserSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onEvent(event: string, callback: (...args: any[]) => void): void {
  const s = getSocket();
  s.on(event, callback);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function offEvent(event: string, callback?: (...args: any[]) => void): void {
  const s = getSocket();
  s.off(event, callback);
}