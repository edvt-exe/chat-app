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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-ios-bg relative">
      <div className="shrink-0 z-10 relative">
        <StoriesBar />
      </div>

      {activeConversation ? (
        <>
          {/* Header blur */}
          <div className="shrink-0 px-5 py-3 border-b border-ios-border bg-ios-bg/70 backdrop-blur-2xl flex items-center gap-3 z-10">
            {otherUser ? (
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-ios-hover flex items-center justify-center text-[15px] font-semibold text-white overflow-hidden">
                  {otherUser.avatarUrl ? (
                    <img src={getAvatarUrl(otherUser.avatarUrl) || ''} className="w-full h-full object-cover" alt="" />
                  ) : (
                    otherUser.username[0].toUpperCase()
                  )}
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-ios-hover flex items-center justify-center text-[18px]">👥</div>
            )}
            <div>
              <p className="text-[15px] font-semibold text-white leading-tight">
                {activeConversation.name || otherUser?.username || 'Unknown'}
              </p>
              {otherUser?.isOnline ? (
                <p className="text-[12px] text-ios-text-sec mt-0.5">Active Now</p>
              ) : otherUser?.lastSeenAt ? (
                <p className="text-[12px] text-ios-text-sec mt-0.5">
                  Last seen {new Date(otherUser.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : null}
            </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto px-5 py-4 z-0 relative"
            style={wallpaper ? { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {wallpaper && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}
            
            <div className="relative z-10">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
                  <p className="text-[13px] text-ios-text-sec">Say hi!</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isLast={idx === messages.length - 1} 
                  otherUserId={otherUser?.id}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="shrink-0 z-10 bg-ios-bg border-t border-ios-border">
            <TypingIndicator conversationId={activeConversation.id} />
            <MessageInput />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 z-10">
          <p className="text-[18px] text-ios-text-sec font-medium">Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );
}