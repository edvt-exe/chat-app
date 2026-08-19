import { Router } from 'express';
import { upload } from '../middleware/upload';
import { requireAuth } from '../middleware/auth';
import {
  createStoryHandler,
  getStoriesHandler,
  viewStoryHandler,
} from '../controllers/story.controller';

const router = Router();

router.post('/', requireAuth, upload.single('file'), createStoryHandler);
router.get('/', requireAuth, getStoriesHandler);
router.post('/:storyId/view', requireAuth, viewStoryHandler);

export default router;