import { prisma } from '../db/prisma';

export async function toggleReaction(userId: string, messageId: string, emoji: string) {
  const existing = await prisma.reaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
  } else {
    await prisma.reaction.create({
      data: { messageId, userId, emoji },
    });
  }

  return getMessageReactions(messageId);
}

export async function getMessageReactions(messageId: string) {
  const reactions = await prisma.reaction.findMany({
    where: { messageId },
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  return reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push({ userId: r.userId, username: r.user.username });
    return acc;
  }, {} as Record<string, { userId: string; username: string }[]>);
}