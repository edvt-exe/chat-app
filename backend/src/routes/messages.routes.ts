import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../db/prisma';
import type { Response } from 'express';

const router = Router();

router.delete('/:messageId', requireAuth, async (req: AuthRequest, res: Response) => {
  const messageId = Array.isArray(req.params.messageId)
    ? req.params.messageId[0]
    : req.params.messageId;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return res.status(404).json({ error: 'Message not found' });
  if (message.senderId !== req.userId) return res.status(403).json({ error: 'Not your message' });

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: null },
  });

  res.json(updated);
});

export default router;