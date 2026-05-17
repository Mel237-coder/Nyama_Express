import { Server, Socket } from 'socket.io';
import { getSupabaseAdmin } from '../config/supabase';

// Module-level reference to the Socket.IO server instance
let io: Server | null = null;

/**
 * Store the Socket.IO server instance so we can emit targeted events
 * (e.g. delivery requests) outside of a socket handler context.
 */
export function setSocketServer(server: Server): void {
  io = server;
}

/**
 * Emit a delivery_request event to a specific driver's room.
 * Called by the order-matching service when a new order needs a driver.
 */
export function emitDeliveryRequest(
  driverId: string,
  payload: {
    orderId: string;
    orderNumber: string;
    restaurantName: string;
    pickupAddress: string;
    deliveryAddress: string;
    distanceKm: number;
    earnings: number;
  },
): void {
  if (!io) {
    console.error('[DriverSocket] Cannot emit delivery_request: Socket.IO server not set');
    return;
  }
  io.to(`driver:${driverId}`).emit('delivery_request', payload);
}

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