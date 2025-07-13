import { Server, Socket } from 'socket.io';


export const orderSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(' Client connected: ', socket.id);

    socket.on('joinShopRoom', (shopId: string) => {
      socket.join(shopId);
      console.log(` Socket ${socket.id} joined room ${shopId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
