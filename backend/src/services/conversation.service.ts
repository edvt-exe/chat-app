import { prisma } from '../db/prisma';

export async function getUserConversationIds(userId: string): Promise<string[]> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  return participations.map((p) => p.conversationId);
}

const includeUserData = {
  participants: {
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true, isOnline: true, lastSeenAt: true },
      },
    },
  },
};

export async function findOrCreateDirectConversation(userIdA: string, userIdB: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId: userIdA } } },
        { participants: { some: { userId: userIdB } } },
      ],
    },
    include: includeUserData,
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId: userIdA }, { userId: userIdB }],
      },
    },
    include: includeUserData,
  });
}

export async function createGroupConversation(creatorId: string, name: string, participantIds: string[]) {
  const allIds = [...new Set([creatorId, ...participantIds])];
  
  return prisma.conversation.create({
    data: {
      isGroup: true,
      name,
      participants: {
        create: allIds.map((id) => ({ userId: id })),
      },
    },
    include: includeUserData,
  });
}

export async function isUserInConversation(userId: string, conversationId: string): Promise<boolean> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  return !!participant;
}