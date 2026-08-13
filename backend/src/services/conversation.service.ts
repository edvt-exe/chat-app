import { prisma } from '../db/prisma';

export async function getUserConversationIds(userId: string): Promise<string[]> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  return participations.map((p) => p.conversationId);
}

// gaseste o conversatie 1-la-1 intre doi useri, sau o creeaza daca nu exista
export async function findOrCreateDirectConversation(userIdA: string, userIdB: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId: userIdA } } },
        { participants: { some: { userId: userIdB } } },
      ],
    },
    include: { participants: true },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId: userIdA }, { userId: userIdB }],
      },
    },
    include: { participants: true },
  });
}

export async function isUserInConversation(userId: string, conversationId: string): Promise<boolean> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  return !!participant;
}