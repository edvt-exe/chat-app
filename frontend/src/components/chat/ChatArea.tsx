import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import StoriesBar from '../stories/StoriesBar';

const API = 'http://localhost:3000';

function getAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API}${url}`;
}

export default function ChatArea() {
  const { activeConversation, messages } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [wallpaper, setWallpaper] = useState(localStorage.getItem('wallpaper') || '');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleWallpaperChange() {
      setWallpaper(localStorage.getItem('wallpaper') || '');
    }
    window.addEventListener('wallpaper-change', handleWallpaperChange);
    return () => window.removeEventListener('wallpaper-change', handleWallpaperChange);
  }, []);

  function getOtherUser(conv: typeof activeConversation) {
    if (!conv) return null;
    return conv.participants?.find((p) => p.userId !== user?.id)?.user || null;
  }

  const otherUser = getOtherUser(activeConversation);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#060b14',
        position: 'relative',
      }}
    >
      {/* ambient glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* stories bar — fixed height, no horizontal scroll */}
      <div style={{ flexShrink: 0, zIndex: 1, position: 'relative' }}>
        <StoriesBar />
      </div>

      {activeConversation ? (
        <>
          {/* chat header */}
          <div style={{
            flexShrink: 0,
            padding: '12px 20px',
            borderBottom: '1px solid rgba(0,200,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 1,
          }}>
            {otherUser ? (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0066ff, #00c8ff)',
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, color: 'white',
                }}>
                  {otherUser.avatarUrl ? (
                    <img
                      src={getAvatarUrl(otherUser.avatarUrl) || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt=""
                    />
                  ) : (
                    otherUser.username[0].toUpperCase()
                  )}
                </div>
                {otherUser.isOnline && (
                  <span style={{
                    position: 'absolute', bottom: 1, right: 1,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#22d46a',
                    border: '2px solid #060b14',
                  }} />
                )}
              </div>
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(0,200,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                👥
              </div>
            )}
            <div>
              <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>
                {activeConversation.name || otherUser?.username || 'Unknown'}
              </p>
              {otherUser?.isOnline ? (
                <p style={{ color: '#22d46a', fontSize: 11, margin: 0 }}>● Online</p>
              ) : otherUser?.lastSeenAt ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
                  Last seen {new Date(otherUser.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : null}
            </div>
          </div>

          {/* messages area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 20px',
            zIndex: 1,
            position: 'relative',
            backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'local',
          }}>
            {wallpaper && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(6,11,20,0.75)',
                pointerEvents: 'none',
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
                  <span style={{ fontSize: 40 }}>💬</span>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No messages yet. Say hi!</p>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* typing + input */}
          <div style={{ flexShrink: 0, zIndex: 1 }}>
            <TypingIndicator conversationId={activeConversation.id} />
            <MessageInput />
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          zIndex: 1,
          position: 'relative',
        }}>
          <div style={{ fontSize: 48, color: 'rgba(0,200,255,0.2)', fontWeight: 700 }}>✦</div>
          <p style={{ color: 'rgba(0,200,255,0.5)', fontSize: 18, fontWeight: 600 }}>NexusChat</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Search for a user to start chatting</p>
        </div>
      )}
    </div>
  );
}