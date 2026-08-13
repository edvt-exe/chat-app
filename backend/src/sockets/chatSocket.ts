import { Server } from 'socket.io';
import { prisma } from '../db/prisma';
import { AuthenticatedSocket } from '../types/socket.types';
import {
  getUserConversationIds,
  findOrCreateDirectConversation,
  isUserInConversation,
} from '../services/conversation.service';
import { saveMessage, getConversationMessages } from '../services/message.service';

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId!;

  async function handleConnect() {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    const conversationIds = await getUserConversationIds(userId);
    conversationIds.forEach((id) => socket.join(id));

    socket.broadcast.emit('user:online', { userId });
  }

  socket.on('conversation:start', async ({ targetUserId }, callback) => {
    try {
      const conversation = await findOrCreateDirectConversation(userId, targetUserId);
      socket.join(conversation.id);

      // baga si celalalt user in camera, daca e conectat
      const targetSockets = await io.fetchSockets();
      targetSockets.forEach((s) => {
        if ((s as unknown as AuthenticatedSocket).userId === targetUserId) {
          s.join(conversation.id);
        }
      });

      callback({ success: true, conversation });
    } catch (err) {
      callback({ success: false, error: 'Could not start conversation' });
    }
  });

  socket.on('message:send', async ({ conversationId, content }, callback) => {
    if (!content || !content.trim()) {
      return callback?.({ success: false, error: 'Message cannot be empty' });
    }

    const allowed = await isUserInConversation(userId, conversationId);
    if (!allowed) {
      return callback?.({ success: false, error: 'Not a participant of this conversation' });
    }

    try {
      const message = await saveMessage(userId, { conversationId, content: content.trim() });

      io.to(conversationId).emit('message:new', message);
      callback?.({ success: true, message });
    } catch (err) {
      callback?.({ success: false, error: 'Failed to send message' });
    }
  });

  socket.on('conversation:history', async ({ conversationId }, callback) => {
    const allowed = await isUserInConversation(userId, conversationId);
    if (!allowed) {
      return callback?.({ success: false, error: 'Not a participant of this conversation' });
    }

    const messages = await getConversationMessages(conversationId);
    callback?.({ success: true, messages: messages.reverse() });
  });

  socket.on('disconnect', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeenAt: new Date() },
    });

    socket.broadcast.emit('user:offline', { userId });
  });

  handleConnect();
}