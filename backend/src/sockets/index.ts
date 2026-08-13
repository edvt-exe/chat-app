import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from './authSocket';
import { registerChatHandlers } from './chatSocket';
import { AuthenticatedSocket } from '../types/socket.types';

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`User connected: ${authSocket.username} (${authSocket.userId})`);

    registerChatHandlers(io, authSocket);
  });

  return io;
}