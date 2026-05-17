import { Server, Socket } from 'socket.io';
import { getSupabaseAdmin } from '../config/supabase';

export function registerDriverHandlers(io: Server, socket: Socket) {
  // Driver sends GPS location update
  socket.on('driver_location_update', async (data: {
    driver_id: string;
    lat: number;
    lng: number;
  }) => {
    const supabase = getSupabaseAdmin();
    await supabase
      .from('drivers')
      .update({
        current_location: `SRID=4326;POINT(${data.lng},${data.lat})`,
        current_location_updated_at: new Date().toISOString(),
      })
      .eq('id', data.driver_id);

    // Broadcast to any active order tracking rooms
    socket.broadcast.emit('driver_location', {
      driver_id: data.driver_id,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('join_room', (room: string) => {
    socket.join(room);
  });

  socket.on('leave_room', (room: string) => {
    socket.leave(room);
  });
}