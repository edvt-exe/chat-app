import { Server } from 'socket.io';
import { prisma } from '../db/prisma';
import { AuthenticatedSocket } from '../types/socket.types';
import {
  getUserConversationIds,
  findOrCreateDirectConversation,
  isUserInConversation,
} from '../services/conversation.service';
import { saveMessage, saveFileMessage, getConversationMessages } from '../services/message.service';
import { toggleReaction } from '../services/reaction.service';

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

      const targetSockets = await io.fetchSockets();
      targetSockets.forEach((s) => {
        if ((s as unknown as AuthenticatedSocket).userId === targetUserId) {
          s.join(conversation.id);
        }
      });

      callback({ success: true, conversation });
    } catch {
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
    } catch {
      callback?.({ success: false, error: 'Failed to send message' });
    }
  });

  socket.on('message:sendFile', async ({ conversationId, fileUrl, fileName, fileSize, messageType }, callback) => {
    const allowed = await isUserInConversation(userId, conversationId);
    if (!allowed) {
      return callback?.({ success: false, error: 'Not a participant of this conversation' });
    }

    try {
      const message = await saveFileMessage(userId, conversationId, fileUrl, fileName, fileSize, messageType);
      io.to(conversationId).emit('message:new', message);
      callback?.({ success: true, message });
    } catch {
      callback?.({ success: false, error: 'Failed to send file message' });
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

  socket.on('reaction:toggle', async ({ messageId, emoji }, callback) => {
    if (!emoji || !messageId) {
      return callback?.({ success: false, error: 'Missing messageId or emoji' });
    }

    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { conversationId: true },
      });

      if (!message) {
        return callback?.({ success: false, error: 'Message not found' });
      }

      const allowed = await isUserInConversation(userId, message.conversationId);
      if (!allowed) {
        return callback?.({ success: false, error: 'Not a participant of this conversation' });
      }

      const reactions = await toggleReaction(userId, messageId, emoji);
      io.to(message.conversationId).emit('reaction:updated', { messageId, reactions });
      callback?.({ success: true, reactions });
    } catch {
      callback?.({ success: false, error: 'Failed to toggle reaction' });
    }
  });

  socket.on('typing:start', ({ conversationId }) => {
    socket.to(conversationId).emit('typing:start', { userId, username: socket.username });
  });

  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(conversationId).emit('typing:stop', { userId });
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