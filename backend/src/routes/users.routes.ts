import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../db/prisma';
import type { Response } from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const router = Router();

router.get('/search', requireAuth, async (req: AuthRequest, res: Response) => {
  const query = req.query.q as string;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }
  const users = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: 'insensitive' },
      NOT: { id: req.userId },
    },
    select: { id: true, username: true, avatarUrl: true, isOnline: true },
    take: 10,
  });
  res.json(users);
});

router.get('/conversations', requireAuth, async (req: AuthRequest, res: Response) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: req.userId } },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, isOnline: true, lastSeenAt: true },
          },
        },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, username: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(conversations);
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, username: true, email: true, avatarUrl: true, bio: true, isOnline: true, createdAt: true },
  });
  res.json(user);
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const name = `avatar-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, name);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { bio, username } = req.body;

  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: req.userId } },
    });
    if (existing) return res.status(409).json({ error: 'Username already taken' });
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { ...(bio !== undefined && { bio }), ...(username && { username }) },
    select: { id: true, username: true, email: true, avatarUrl: true, bio: true },
  });
  res.json(updated);
});

router.post('/me/avatar', requireAuth, avatarUpload.single('avatar'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { avatarUrl: `/uploads/${req.file.filename}` },
    select: { id: true, username: true, avatarUrl: true },
  });
  res.json(updated);
});

router.patch('/me/password', requireAuth, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.userId }, data: { passwordHash: hash } });
  res.json({ success: true });
});

export default router;