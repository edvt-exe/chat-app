import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import type { Request } from 'express';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/gif': 'IMAGE',
  'image/webp': 'IMAGE',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
  'video/quicktime': 'VIDEO',
  'video/x-msvideo': 'VIDEO',
  'audio/mpeg': 'AUDIO',
  'audio/wav': 'AUDIO',
  'audio/ogg': 'AUDIO',
  'audio/webm': 'AUDIO',
  'application/pdf': 'FILE',
  'application/msword': 'FILE',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'FILE',
  'text/plain': 'FILE',
  'application/zip': 'FILE',
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB pentru video

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

function fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
  else cb(new Error(`File type ${file.mimetype} is not allowed`));
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

export function getMessageTypeFromMime(mimetype: string): string {
  return ALLOWED_TYPES[mimetype] || 'FILE';
}