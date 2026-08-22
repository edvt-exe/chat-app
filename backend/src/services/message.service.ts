import { prisma } from '../db/prisma';
import type { SendMessageInput } from '../types/message.types';

function groupReactions(reactions: any[]) {
  return reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push({ userId: r.userId, username: r.user?.username || '' });
    return acc;
  }, {} as Record<string, { userId: string; username: string }[]>);
}

export async function saveMessage(senderId: string, input: SendMessageInput) {
  const { conversationId, content } = input;

  const msg = await prisma.message.create({
    data: { conversationId, senderId, content, messageType: 'TEXT' },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
      reactions: { include: { user: { select: { id: true, username: true } } } },
    },
  });

  return { ...msg, reactions: groupReactions(msg.reactions) };
}

export async function saveFileMessage(
  senderId: string,
  conversationId: string,
  fileUrl: string,
  fileName: string,
  fileSize: number,
  messageType: string
) {
  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      messageType: messageType as any,
      fileUrl,
      fileName,
      fileSize,
    },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
      reactions: { include: { user: { select: { id: true, username: true } } } },
    },
  });

  return { ...msg, reactions: groupReactions(msg.reactions) };
}

export async function getConversationMessages(conversationId: string, limit = 50) {
  const msgs = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
      reactions: { include: { user: { select: { id: true, username: true } } } },
    },
  });

  return msgs.map((m) => ({ ...m, reactions: groupReactions(m.reactions) }));
}