import { deleteExpiredStories } from '../services/story.service';

export function startCleanupJob() {
  // ruleaza la fiecare ora
  setInterval(async () => {
    const count = await deleteExpiredStories();
    if (count > 0) console.log(`Cleaned up ${count} expired stories`);
  }, 60 * 60 * 1000);
}