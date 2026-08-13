import { prisma } from '../db/prisma';

export async function getUserConversationIds(userId: string): Promise<string[]> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  return participations.map((p) => p.conversationId);
}