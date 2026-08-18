import { Router } from 'express';
import { upload } from '../middleware/upload';
import { uploadHandler } from '../controllers/upload.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, upload.single('file'), uploadHandler);

export default router;