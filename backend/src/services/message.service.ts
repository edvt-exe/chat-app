import { prisma } from '../db/prisma';

function groupReactions(reactions: any[]) {
  return reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push({ userId: r.userId, username: r.user?.username || '' });
    return acc;
  }, {} as Record<string, { userId: string; username: string }[]>);
}

const messageInclude = {
  sender: { select: { id: true, username: true, avatarUrl: true } },
  reactions: { include: { user: { select: { id: true, username: true } } } },
  replyTo: { select: { id: true, content: true, messageType: true, sender: { select: { username: true } } } }
};

export async function saveMessage(senderId: string, input: { conversationId: string; content: string; replyToId?: string }) {
  const { conversationId, content, replyToId } = input;

  const msg = await prisma.message.create({
    data: { conversationId, senderId, content, messageType: 'TEXT', replyToId },
    include: messageInclude,
  });

  return { ...msg, reactions: groupReactions(msg.reactions) };
}

export async function saveFileMessage(
  senderId: string, conversationId: string, fileUrl: string, fileName: string, fileSize: number, messageType: string
) {
  const msg = await prisma.message.create({
    data: { conversationId, senderId, messageType: messageType as any, fileUrl, fileName, fileSize },
    include: messageInclude,
  });

  return { ...msg, reactions: groupReactions(msg.reactions) };
}

export async function getConversationMessages(conversationId: string, limit = 50) {
  const msgs = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: messageInclude,
  });

  return msgs.map((m) => ({ ...m, reactions: groupReactions(m.reactions) }));
}