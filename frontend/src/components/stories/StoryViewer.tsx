import { useState, useEffect } from 'react';
import type { Story } from '../../types';
import api from '../../services/api';

interface Props {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

const API = 'http://localhost:3000';

export default function StoryViewer({ stories, initialIndex = 0, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const story = stories[current];

  useEffect(() => {
    if (!story) return;
    api.post(`/api/stories/${story.id}/view`).catch(() => {});

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          if (current < stories.length - 1) {
            setCurrent((c) => c + 1);
          } else {
            onClose();
          }
          return 100;
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [current, story]);

  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ maxHeight: '85vh', background: '#0a1020' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div
                className="h-full rounded-full transition-none"
                style={{
                  background: '#00c8ff',
                  width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-6 left-0 right-0 z-10 flex items-center gap-3 px-4 pt-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: 'linear-gradient(135deg, #0066ff, #00c8ff)', color: 'white' }}>
            {story.user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{story.user.username}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/50 hover:text-white text-xl">✕</button>
        </div>

        <div className="w-full" style={{ aspectRatio: '9/16', maxHeight: '85vh' }}>
          {story.mediaType === 'IMAGE' ? (
            <img src={`${API}${story.mediaUrl}`} className="w-full h-full object-cover" alt="" />
          ) : (
            <video src={`${API}${story.mediaUrl}`} className="w-full h-full object-cover" autoPlay muted />
          )}
        </div>

        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
            <p className="text-white text-sm">{story.caption}</p>
          </div>
        )}

        <button
          className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.max(0, c - 1)); }}
        />
        <button
          className="absolute right-0 top-0 bottom-0 w-1/3 z-20"
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.min(stories.length - 1, c + 1)); }}
        />
      </div>
    </div>
  );
}