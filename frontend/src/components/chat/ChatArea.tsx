import { useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import StoriesBar from '../stories/StoriesBar';
import Avatar from '../ui/Avatar';

export default function ChatArea() {
  const { activeConversation, messages } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function getOtherUser(conv: typeof activeConversation) {
    if (!conv) return null;
    return conv.participants?.find((p) => p.userId !== user?.id)?.user || null;
  }

  const otherUser = getOtherUser(activeConversation);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#060b14' }}>
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)', zIndex: 0 }}
      />

      <StoriesBar />

      {activeConversation ? (
        <>
          <div
            className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(0,200,255,0.08)', background: 'rgba(255,255,255,0.02)', position: 'relative', zIndex: 1 }}
          >
            {otherUser ? (
              <Avatar user={{ username: otherUser.username, avatarUrl: otherUser.avatarUrl, isOnline: otherUser.isOnline }} size="md" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.2)', color: '#00c8ff' }}>
                👥
              </div>
            )}
            <div>
              <p className="font-semibold text-white text-sm">
                {activeConversation.name || otherUser?.username || 'Unknown'}
              </p>
              {otherUser?.isOnline && (
                <p className="text-xs" style={{ color: '#22d46a' }}>● Online</p>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4" style={{ position: 'relative', zIndex: 1 }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <span className="text-4xl">💬</span>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No messages yet. Say hi!</p>
              </div>
            )}
            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            <div ref={bottomRef} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <MessageInput />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-6xl">✦</div>
          <p className="text-lg font-semibold" style={{ color: 'rgba(0,200,255,0.6)' }}>NexusChat</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Select a conversation or start a new one
          </p>
        </div>
      )}
    </div>
  );
}