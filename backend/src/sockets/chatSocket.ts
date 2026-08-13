import { Server } from 'socket.io';
import { prisma } from '../db/prisma';
import { AuthenticatedSocket } from '../types/socket.types';
import { getUserConversationIds } from '../services/conversation.service';

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId!;

  // marcheaza userul ca online si il baga in camerele conversatiilor lui
  async function handleConnect() {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    const conversationIds = await getUserConversationIds(userId);
    conversationIds.forEach((id) => socket.join(id));

    socket.broadcast.emit('user:online', { userId });
  }

  socket.on('disconnect', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeenAt: new Date() },
    });

    socket.broadcast.emit('user:offline', { userId });
  });

  handleConnect();
}