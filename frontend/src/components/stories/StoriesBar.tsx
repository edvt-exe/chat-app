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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0,200,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        scrollbarWidth: 'none',
      } as React.CSSProperties}>

        {/* buton add story */}
        <button
          onClick={handleAddStory}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,200,255,0.06)',
            border: '1px dashed rgba(0,200,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#00c8ff',
          }}>
            +
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Add</span>
        </button>

        {Object.values(grouped).map(({ user: storyUser, stories: userStories }) => {
          const hasUnviewed = userStories.some(
            (s) => !s.views.find((v) => v.userId === user?.id)
          );

          return (
            <button
              key={storyUser.id}
              onClick={() => setViewerData({ stories: userStories, index: 0 })}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%', padding: 2,
                background: hasUnviewed
                  ? 'linear-gradient(135deg, #00c8ff, #0066ff)'
                  : 'rgba(0,200,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#0d1829',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {storyUser.avatarUrl ? (
                    <img
                      src={storyUser.avatarUrl.startsWith('http') ? storyUser.avatarUrl : `http://localhost:3000${storyUser.avatarUrl}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt=""
                    />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#00c8ff' }}>
                      {storyUser.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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