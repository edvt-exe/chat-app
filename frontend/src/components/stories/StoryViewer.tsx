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
          if (current < stories.length - 1) setCurrent((c) => c + 1);
          else onClose();
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
    <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center" onClick={onClose}>
      
      {current > 0 && (
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-4 w-11 h-11 rounded-full bg-ios-input/50 text-white flex items-center justify-center z-10 hover:bg-ios-hover">
          ‹
        </button>
      )}
      {current < stories.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 w-11 h-11 rounded-full bg-ios-input/50 text-white flex items-center justify-center z-10 hover:bg-ios-hover">
          ›
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[400px] max-h-[92vh] aspect-[9/16] rounded-[24px] overflow-hidden bg-black shadow-2xl">
        
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white" style={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-10 flex items-center gap-3 px-4 py-2">
          <div className="w-9 h-9 rounded-full bg-ios-hover flex items-center justify-center text-[13px] font-semibold text-white overflow-hidden">
            {story.user.avatarUrl ? (
              <img src={story.user.avatarUrl.startsWith('http') ? story.user.avatarUrl : `${API}${story.user.avatarUrl}`} className="w-full h-full object-cover" alt="" />
            ) : story.user.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-[14px] leading-tight">{story.user.username}</p>
            <p className="text-white/60 text-[11px]">
              {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center">✕</button>
        </div>

        {/* Media */}
        <div className="w-full h-full bg-black flex items-center justify-center">
          {story.mediaType === 'IMAGE' ? (
            <img src={`${API}${story.mediaUrl}`} className="w-full h-full object-cover" alt="" />
          ) : (
            <video src={`${API}${story.mediaUrl}`} className="w-full h-full object-cover" autoPlay muted playsInline />
          )}
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-16 left-0 right-0 px-4 pt-8 pb-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-[15px]">{story.caption}</p>
          </div>
        )}

        {/* Reaction Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-2 bg-gradient-to-t from-black to-transparent">
          {sentReaction ? (
            <div className="text-[32px]">{sentReaction}</div>
          ) : showReactions ? (
            <div className="flex gap-2">
              {STORY_EMOJIS.map((emoji) => (
                <button
                  key={emoji} onClick={() => handleReact(emoji)}
                  className="w-10 h-10 rounded-full bg-white/10 text-[24px] flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setShowReactions(true)} className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white text-[14px] font-medium hover:bg-white/20 transition-colors">
              React
            </button>
          )}
        </div>

        <button className="absolute left-0 top-0 bottom-16 w-1/3 z-0" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
        <button className="absolute right-0 top-0 bottom-16 w-1/3 z-0" onClick={(e) => { e.stopPropagation(); goNext(); }} />
      </div>
    </div>
  );
}

export default function StoryViewer(props: Props) {
  return createPortal(<StoryViewerContent {...props} />, document.body);
}