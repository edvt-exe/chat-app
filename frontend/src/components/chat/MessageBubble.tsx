import { useState } from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const API = 'http://localhost:3000';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const { user } = useAuth();
  const { toggleReaction } = useChat();
  const [showEmojis, setShowEmojis] = useState(false);

  const isMine = message.senderId === user?.id;

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderContent() {
    if (message.messageType === 'TEXT') {
      return <p className="text-sm leading-relaxed break-words">{message.content}</p>;
    }
    if (message.messageType === 'IMAGE') {
      return (
        <img
          src={`${API}${message.fileUrl}`}
          alt={message.fileName || 'image'}
          className="max-w-xs rounded-xl cursor-pointer"
          onClick={() => window.open(`${API}${message.fileUrl}`, '_blank')}
        />
      );
    }
    if (message.messageType === 'AUDIO') {
      return (
        <audio controls className="max-w-xs">
          <source src={`${API}${message.fileUrl}`} />
        </audio>
      );
    }
    if (message.messageType === 'VIDEO') {
      return (
        <video controls className="max-w-xs rounded-xl">
          <source src={`${API}${message.fileUrl}`} />
        </video>
      );
    }
    return (
      <a
        href={`${API}${message.fileUrl}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-sm hover:underline"
        style={{ color: '#00c8ff' }}
      >
        📎 {message.fileName}
      </a>
    );
  }

  const reactionEntries = Object.entries(message.reactions || {});

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group mb-3`}>
      <div className="relative max-w-sm">
        <div
          className="px-4 py-2.5 rounded-2xl"
          style={isMine ? {
            background: 'linear-gradient(135deg, rgba(0,150,255,0.35), rgba(0,200,255,0.25))',
            border: '1px solid rgba(0,200,255,0.3)',
            borderBottomRightRadius: '4px',
            color: '#e8f8ff',
            backdropFilter: 'blur(10px)',
          } : {
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(0,200,255,0.12)',
            borderBottomLeftRadius: '4px',
            color: '#d0e8ff',
            backdropFilter: 'blur(10px)',
          }}
        >
          {!isMine && (
            <p className="text-xs font-semibold mb-1" style={{ color: '#00c8ff' }}>
              {message.sender.username}
            </p>
          )}
          {renderContent()}
          <p className="text-xs mt-1 text-right" style={{ color: isMine ? 'rgba(0,200,255,0.5)' : 'rgba(255,255,255,0.3)' }}>
            {formatTime(message.createdAt)}
          </p>
        </div>

        {reactionEntries.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {reactionEntries.map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(message.id, emoji)}
                className="rounded-full px-2 py-0.5 text-xs flex items-center gap-1 transition-colors"
                style={{
                  background: 'rgba(0,200,255,0.08)',
                  border: '1px solid rgba(0,200,255,0.2)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {emoji} <span style={{ color: 'rgba(0,200,255,0.6)' }}>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className={`absolute top-1 ${isMine ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity text-lg`}
          style={{ color: 'rgba(0,200,255,0.5)' }}
        >
          😊
        </button>

        {showEmojis && (
          <div
            className={`absolute top-6 ${isMine ? 'right-0' : 'left-0'} rounded-xl p-2 flex gap-1 z-10`}
            style={{
              background: 'rgba(10,16,32,0.95)',
              border: '1px solid rgba(0,200,255,0.2)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { toggleReaction(message.id, emoji); setShowEmojis(false); }}
                className="text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}