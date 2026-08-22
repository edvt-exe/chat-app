import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Story } from '../../types';
import { useChat } from '../../contexts/ChatContext';
import api from '../../services/api';

interface Props {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

const API = 'http://localhost:3000';
const STORY_EMOJIS = ['❤️', '🔥', '😮', '😂', '👏', '💯'];

function StoryViewerContent({ stories, initialIndex = 0, onClose }: Props) {
  const { reactToStory } = useChat();
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [sentReaction, setSentReaction] = useState<string | null>(null);

  const story = stories[current];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!story) return;
    api.post(`/api/stories/${story.id}/view`).catch(() => {});
    setProgress(0);
    setSentReaction(null);

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
  }, [current]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current]);

  function goNext() {
    if (current < stories.length - 1) setCurrent((c) => c + 1);
    else onClose();
  }

  function goPrev() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  function handleReact(emoji: string) {
    reactToStory(story.id, emoji);
    setSentReaction(emoji);
    setShowReactions(false);
    setTimeout(() => setSentReaction(null), 2000);
  }

  if (!story) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* prev/next buttons esterni */}
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          style={{
            position: 'absolute', left: 16,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >
          ‹
        </button>
      )}
      {current < stories.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          style={{
            position: 'absolute', right: 16,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >
          ›
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 400, maxHeight: '92vh',
          borderRadius: 20, overflow: 'hidden',
          background: '#000',
          boxShadow: '0 0 80px rgba(0,200,255,0.15)',
        }}
      >
        {/* progress */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', gap: 4, padding: 12 }}>
          {stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2, background: '#00c8ff',
                width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
              }} />
            </div>
          ))}
        </div>

        {/* header */}
        <div style={{ position: 'absolute', top: 24, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0066ff, #00c8ff)',
            flexShrink: 0, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: 'white',
          }}>
            {story.user.avatarUrl ? (
              <img src={story.user.avatarUrl.startsWith('http') ? story.user.avatarUrl : `${API}${story.user.avatarUrl}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : story.user.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{story.user.username}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>
              {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' · '}{story.views.length} views
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* media */}
        <div style={{ width: '100%', aspectRatio: '9/16', maxHeight: '92vh' }}>
          {story.mediaType === 'IMAGE' ? (
            <img src={`${API}${story.mediaUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
          ) : (
            <video src={`${API}${story.mediaUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} autoPlay muted playsInline />
          )}
        </div>

        {story.caption && (
          <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, padding: '32px 16px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
            <p style={{ color: 'white', fontSize: 14, margin: 0 }}>{story.caption}</p>
          </div>
        )}

        {/* reaction bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
          {sentReaction ? (
            <div style={{ fontSize: 32, animation: 'none' }}>{sentReaction}</div>
          ) : showReactions ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {STORY_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  style={{ fontSize: 24, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setShowReactions(true)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '6px 16px',
                color: 'white', fontSize: 13, cursor: 'pointer',
              }}
            >
              React ❤️
            </button>
          )}
        </div>

        {/* nav zones */}
        <button style={{ position: 'absolute', left: 0, top: 0, bottom: 60, width: '35%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 5 }}
          onClick={(e) => { e.stopPropagation(); goPrev(); }} />
        <button style={{ position: 'absolute', right: 0, top: 0, bottom: 60, width: '35%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 5 }}
          onClick={(e) => { e.stopPropagation(); goNext(); }} />
      </div>
    </div>
  );
}

export default function StoryViewer(props: Props) {
  return createPortal(<StoryViewerContent {...props} />, document.body);
}