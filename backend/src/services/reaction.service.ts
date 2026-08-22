import { prisma } from '../db/prisma';

function groupReactions(reactions: any[]) {
  return reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push({ userId: r.userId, username: r.user?.username || '' });
    return acc;
  }, {} as Record<string, { userId: string; username: string }[]>);
}

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

  const reactions = await prisma.reaction.findMany({
    where: { messageId },
    include: { user: { select: { id: true, username: true } } },
  });

  return groupReactions(reactions);
}