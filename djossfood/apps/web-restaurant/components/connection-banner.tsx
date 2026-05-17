'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { WifiOff } from 'lucide-react';

export function ConnectionBanner() {
  const [isDisconnected, setIsDisconnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleDisconnect = () => setIsDisconnected(true);
    const handleConnect = () => setIsDisconnected(false);

    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
    };
  }, []);

  if (!isDisconnected) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-destructive py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" />
      Reconnexion en cours...
    </div>
  );
}