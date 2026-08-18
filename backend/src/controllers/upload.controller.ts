import { Request, Response } from 'express';
import { getMessageTypeFromMime } from '../middleware/upload';

export function uploadHandler(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const messageType = getMessageTypeFromMime(req.file.mimetype);

  res.json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    messageType,
  });
}