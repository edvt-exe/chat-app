import fs from 'fs';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createStory,
  getActiveStories,
  markStoryViewed,
} from '../services/story.service';
import { getMessageTypeFromMime } from '../middleware/upload';
import { io } from '../sockets';

export async function createStoryHandler(req: AuthRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mediaType = getMessageTypeFromMime(req.file.mimetype);
  if (mediaType !== 'IMAGE' && mediaType !== 'VIDEO') {
    return res.status(400).json({ error: 'Stories only support images and videos' });
  }

  try {
    const story = await createStory(
      req.userId!,
      `/uploads/${req.file.filename}`,
      mediaType,
      req.body.caption
    );

    io.emit('story:new', story);
    res.status(201).json(story);
  } catch {
    res.status(500).json({ error: 'Failed to create story' });
  }
}

export async function getStoriesHandler(req: AuthRequest, res: Response) {
  try {
    const stories = await getActiveStories();
    res.json(stories);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
}

export async function viewStoryHandler(req: AuthRequest, res: Response) {
  const storyId = Array.isArray(req.params.storyId)
    ? req.params.storyId[0]
    : req.params.storyId;

  try {
    await markStoryViewed(storyId, req.userId!);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to mark story as viewed' });
  }
}