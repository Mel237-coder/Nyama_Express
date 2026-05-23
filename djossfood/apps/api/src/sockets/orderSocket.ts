import { Server, Socket } from 'socket.io';

export function registerOrderHandlers(io: Server, socket: Socket) {
  socket.on('join_room', (room: string) => {
    if (!room.startsWith('order:')) {
      socket.emit('error', { message: 'Invalid room' });
      return;
    }
    socket.join(room);
  });

  socket.on('leave_room', (room: string) => {
    socket.leave(room);
  });
}

export function emitToRoom(io: Server, room: string, event: string, data: any) {
  io.to(room).emit(event, data);
}