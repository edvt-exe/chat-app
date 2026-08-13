import { prisma } from '../db/prisma';
import { SendMessageInput } from '../types/message.types';

export async function saveMessage(senderId: string, input: SendMessageInput) {
  const { conversationId, content } = input;

  return prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
      messageType: 'TEXT',
    },
    include: {
      sender: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });
}

export async function getConversationMessages(conversationId: string, limit = 50) {
  return prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: {
        select: { id: true, username: true, avatarUrl: true },
      },
      reactions: true,
    },
  });
}