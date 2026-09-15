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
      <div className="flex items-center gap-4 px-4 py-3 border-b border-ios-border bg-ios-bg overflow-x-auto shrink-0 no-scrollbar">

        {/* Buton Add Story */}
        <button
          onClick={handleAddStory}
          className="flex flex-col items-center gap-1.5 shrink-0 bg-transparent border-none cursor-pointer group"
        >
          <div className="w-[52px] h-[52px] rounded-full bg-ios-input border border-ios-border flex items-center justify-center text-[22px] text-ios-text-sec group-hover:text-ios-blue transition-colors">
            +
          </div>
          <span className="text-[11px] font-medium text-ios-text-sec">Add</span>
        </button>

        {Object.values(grouped).map(({ user: storyUser, stories: userStories }) => {
          const hasUnviewed = userStories.some(
            (s) => !s.views.find((v) => v.userId === user?.id)
          );

          return (
            <button
              key={storyUser.id}
              onClick={() => setViewerData({ stories: userStories, index: 0 })}
              className="flex flex-col items-center gap-1.5 shrink-0 bg-transparent border-none cursor-pointer"
            >
              <div className={`w-[52px] h-[52px] rounded-full p-[2.5px] flex items-center justify-center ${
                hasUnviewed ? 'bg-ios-blue' : 'bg-ios-input'
              }`}>
                <div className="w-full h-full rounded-full bg-ios-hover flex items-center justify-center overflow-hidden border-2 border-ios-bg">
                  {storyUser.avatarUrl ? (
                    <img
                      src={storyUser.avatarUrl.startsWith('http') ? storyUser.avatarUrl : `http://localhost:3000${storyUser.avatarUrl}`}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="text-[15px] font-semibold text-white">
                      {storyUser.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-medium text-white max-w-[56px] truncate">
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