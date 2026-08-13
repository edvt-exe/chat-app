import { Socket } from 'socket.io';
import { verifyToken } from '../services/auth.service';
import { AuthenticatedSocket } from '../types/socket.types';

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication token missing'));
  }

  try {
    const payload = verifyToken(token);
    (socket as AuthenticatedSocket).userId = payload.userId;
    (socket as AuthenticatedSocket).username = payload.username;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}