import fs from 'fs';
import path from 'path';
import { prisma } from '../db/prisma';

export async function createStory(userId: string, mediaUrl: string, mediaType: string, caption?: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return prisma.story.create({
    data: {
      userId,
      mediaUrl,
      mediaType: mediaType as any,
      caption,
      expiresAt,
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
}

export async function getActiveStories() {
  return prisma.story.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      views: { select: { userId: true } },
    },
  });
}

export async function markStoryViewed(storyId: string, userId: string) {
  await prisma.storyView.upsert({
    where: { storyId_userId: { storyId, userId } },
    create: { storyId, userId },
    update: {},
  });
}

export async function deleteExpiredStories() {
  const expired = await prisma.story.findMany({
    where: { expiresAt: { lt: new Date() } },
    select: { id: true, mediaUrl: true },
  });

  for (const story of expired) {
    const filePath = path.join(__dirname, '../../', story.mediaUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await prisma.story.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return expired.length;
}