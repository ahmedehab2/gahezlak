import { Server } from 'socket.io';
import { orderSocket } from './order.socket';

let io: Server;

export const initSocket = (server: any): Server => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  orderSocket(io);
  return io;
};

export { io };
