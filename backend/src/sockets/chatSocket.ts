import { Server } from 'socket.io';
import { prisma } from '../db/prisma';
import { AuthenticatedSocket } from '../types/socket.types';
import {
  getUserConversationIds,
  findOrCreateDirectConversation,
  createGroupConversation,
  isUserInConversation,
} from '../services/conversation.service';
import { saveMessage, saveFileMessage, getConversationMessages } from '../services/message.service';
import { toggleReaction } from '../services/reaction.service';

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId!;
  const username = socket.username!;

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

  socket.on('conversation:createGroup', async ({ name, participantIds }, callback) => {
    try {
      const conversation = await createGroupConversation(userId, name, participantIds);
      socket.join(conversation.id);

      const targetSockets = await io.fetchSockets();
      targetSockets.forEach((s) => {
        const sUserId = (s as unknown as AuthenticatedSocket).userId;
        if (sUserId && participantIds.includes(sUserId)) {
          s.join(conversation.id);
          s.emit('conversation:new', conversation);
        }
      });

      callback?.({ success: true, conversation });
    } catch (error) {
      callback?.({ success: false, error: 'Could not create group' });
    }
  });

  socket.on('message:send', async ({ conversationId, content, replyToId }, callback) => {
    if (!content?.trim()) return callback?.({ success: false, error: 'Message cannot be empty' });

    const allowed = await isUserInConversation(userId, conversationId);
    if (!allowed) return callback?.({ success: false, error: 'Not a participant' });

    try {
      const message = await saveMessage(userId, { conversationId, content: content.trim(), replyToId });
      io.to(conversationId).emit('message:new', message);

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId, NOT: { userId } },
        include: { user: { select: { username: true } }, conversation: { select: { isGroup: true, name: true } } },
      });

      participants.forEach((p) => {
        const senderName = p.conversation?.isGroup ? `${username} (${p.conversation.name})` : username;
        io.to(p.userId).emit('notification:message', {
          conversationId,
          senderName,
          content: content.trim().slice(0, 60),
          type: 'TEXT',
        });
      });

      callback?.({ success: true, message });
    } catch {
      callback?.({ success: false, error: 'Failed to send message' });
    }
  });

  socket.on('message:edit', async ({ messageId, content }, callback) => {
    if (!content?.trim()) return callback?.({ success: false, error: 'Content cannot be empty' });

    try {
      const msg = await prisma.message.findUnique({ where: { id: messageId } });
      if (!msg || msg.senderId !== userId) return callback?.({ success: false, error: 'Unauthorized' });

      const updatedMsg = await prisma.message.update({
        where: { id: messageId },
        data: { content: content.trim(), isEdited: true, editedAt: new Date() }
      });

      io.to(updatedMsg.conversationId).emit('message:edited', { messageId, content: updatedMsg.content, isEdited: true });
      callback?.({ success: true });
    } catch (error) {
      callback?.({ success: false, error: 'Failed to edit message' });
    }
  });

  socket.on('message:sendFile', async ({ conversationId, fileUrl, fileName, fileSize, messageType }, callback) => {
    const allowed = await isUserInConversation(userId, conversationId);
    if (!allowed) return callback?.({ success: false, error: 'Not a participant' });

    try {
      const message = await saveFileMessage(userId, conversationId, fileUrl, fileName, fileSize, messageType);
      io.to(conversationId).emit('message:new', message);

      const typeLabels: Record<string, string> = { IMAGE: '📷 Photo', VIDEO: '🎥 Video', AUDIO: '🎵 Audio', FILE: '📎 File' };

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId, NOT: { userId } },
        include: { conversation: { select: { isGroup: true, name: true } } }
      });

      participants.forEach((p) => {
        const senderName = p.conversation?.isGroup ? `${username} (${p.conversation.name})` : username;
        io.to(p.userId).emit('notification:message', {
          conversationId,
          senderName,
          content: typeLabels[messageType] || '📎 File',
          type: messageType,
          fileName,
        });
      });

      callback?.({ success: true, message });
    } catch {
      callback?.({ success: false, error: 'Failed to send file message' });
    }
  });

  socket.on('message:read', async ({ conversationId }) => {
    io.to(conversationId).emit('message:seen', { conversationId, userId });
  });

  socket.on('conversation:history', async ({ conversationId }, callback) => {
    const allowed = await isUserInConversation(userId, conversationId);
    if (!allowed) return callback?.({ success: false, error: 'Not a participant' });

    const messages = await getConversationMessages(conversationId);
    callback?.({ success: true, messages: messages.reverse() });
    socket.to(conversationId).emit('message:seen', { conversationId, userId });
  });

  socket.on('reaction:toggle', async ({ messageId, emoji }, callback) => {
    if (!emoji || !messageId) return callback?.({ success: false, error: 'Missing params' });

    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { conversationId: true, senderId: true },
      });

      if (!message) return callback?.({ success: false, error: 'Message not found' });

      const allowed = await isUserInConversation(userId, message.conversationId);
      if (!allowed) return callback?.({ success: false, error: 'Not a participant' });

      const reactions = await toggleReaction(userId, messageId, emoji);
      io.to(message.conversationId).emit('reaction:updated', { messageId, reactions });

      if (message.senderId !== userId) {
        const reactionValues = Object.values(reactions);
        const userReacted = reactionValues.some((users: any) => users.some((u: any) => u.userId === userId));

        if (userReacted) {
          io.to(message.senderId).emit('notification:reaction', { senderName: username, emoji, type: 'message' });
        }
      }
      callback?.({ success: true, reactions });
    } catch {
      callback?.({ success: false, error: 'Failed to toggle reaction' });
    }
  });

  socket.on('story:react', async ({ storyId, emoji }, callback) => {
    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { userId: true, user: { select: { username: true } } },
      });

      if (!story) return callback?.({ success: false, error: 'Story not found' });
      if (story.userId !== userId) {
        io.to(story.userId).emit('notification:reaction', { senderName: username, emoji, type: 'story' });
      }
      callback?.({ success: true });
    } catch {
      callback?.({ success: false, error: 'Failed to react to story' });
    }
  });

  socket.on('typing:start', ({ conversationId }) => socket.to(conversationId).emit('typing:start', { userId, username }));
  socket.on('typing:stop', ({ conversationId }) => socket.to(conversationId).emit('typing:stop', { userId }));
  socket.on('disconnect', async () => {
    await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeenAt: new Date() } });
    socket.broadcast.emit('user:offline', { userId });
  });

  handleConnect();
}