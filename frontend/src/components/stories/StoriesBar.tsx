import { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import StoryViewer from './StoryViewer';
import type { Story } from '../../types';

export default function StoriesBar() {
  const { stories, loadStories } = useChat();
  const { user } = useAuth();
  const [viewerData, setViewerData] = useState<{ stories: Story[]; index: number } | null>(null);

  useEffect(() => { loadStories(); }, []);

  async function handleAddStory() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/api/stories', formData);
      loadStories();
    };
    input.click();
  }

  const grouped = stories.reduce((acc, story) => {
    if (!acc[story.userId]) acc[story.userId] = { user: story.user, stories: [] };
    acc[story.userId].stories.push(story);
    return acc;
  }, {} as Record<string, { user: any; stories: Story[] }>);

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(0,200,255,0.08)', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}
      >
        <button onClick={handleAddStory} className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-semibold transition-colors"
            style={{ background: 'rgba(0,200,255,0.06)', border: '1px dashed rgba(0,200,255,0.35)', color: '#00c8ff' }}
          >
            +
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Add</span>
        </button>

        {Object.values(grouped).map(({ user: storyUser, stories: userStories }) => {
          const hasUnviewed = userStories.some(
            (s) => !s.views.find((v) => v.userId === user?.id)
          );

          return (
            <button
              key={storyUser.id}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
              onClick={() => setViewerData({ stories: userStories, index: 0 })}
            >
              <div
                className="w-11 h-11 rounded-full p-0.5 flex items-center justify-center"
                style={{
                  background: hasUnviewed
                    ? 'linear-gradient(135deg, #00c8ff, #0066ff)'
                    : 'rgba(0,200,255,0.1)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: '#0d1829' }}
                >
                  {storyUser.avatarUrl ? (
                    <img src={`http://localhost:3000${storyUser.avatarUrl}`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: '#00c8ff' }}>
                      {storyUser.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs max-w-[44px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {storyUser.username}
              </span>
            </button>
          );
        })}
      </div>

      {viewerData && (
        <StoryViewer
          stories={viewerData.stories}
          initialIndex={viewerData.index}
          onClose={() => setViewerData(null)}
        />
      )}
    </>
  );
}