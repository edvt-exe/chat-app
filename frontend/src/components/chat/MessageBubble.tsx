import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];
const API = 'http://localhost:3000';

interface Props {
  message: Message;
  onReply?: (message: Message) => void;
  isLast?: boolean;
  otherUserId?: string;
}

export default function MessageBubble({ message, onReply, isLast, otherUserId }: Props) {
  const { user } = useAuth();
  const { toggleReaction, deleteMessage } = useChat();
  const [showEmojis, setShowEmojis] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMine = message.senderId === user?.id;
  const isSeen = message.seenBy?.includes(otherUserId || '') && isMine;

  // reactia curenta a userului logat pe acest mesaj
  const myCurrentReaction = Object.entries(message.reactions || {}).find(([, users]) =>
    users.some((u) => u.userId === user?.id)
  )?.[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojis(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getAvatarUrl(url: string | null) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API}${url}`;
  }

  function handleEmojiClick(emoji: string) {
    // daca userul a dat deja aceeasi reactie, o scoate (toggle)
    // daca a dat alta reactie, o scoate pe cea veche si o pune pe cea noua
    if (myCurrentReaction && myCurrentReaction !== emoji) {
      toggleReaction(message.id, myCurrentReaction);
    }
    toggleReaction(message.id, emoji);
    setShowEmojis(false);
  }

  function copyText() {
    if (message.content) navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  }

  function renderContent() {
    if (message.deletedAt) {
      return (
        <p style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>
          🚫 Message deleted
        </p>
      );
    }

    if (message.messageType === 'TEXT') {
      return (
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {message.content}
        </p>
      );
    }

    if (message.messageType === 'IMAGE') {
      return (
        <img
          src={`${API}${message.fileUrl}`}
          alt={message.fileName || 'image'}
          style={{ maxWidth: 220, borderRadius: 10, cursor: 'pointer', display: 'block' }}
          onClick={() => window.open(`${API}${message.fileUrl}`, '_blank')}
        />
      );
    }

    if (message.messageType === 'AUDIO') {
      return (
        <audio controls style={{ maxWidth: 220, height: 36 }}>
          <source src={`${API}${message.fileUrl}`} />
        </audio>
      );
    }

    if (message.messageType === 'VIDEO') {
      return (
        <video controls style={{ maxWidth: 220, borderRadius: 10, maxHeight: 280 }} preload="metadata">
          <source src={`${API}${message.fileUrl}`} type="video/mp4" />
          <source src={`${API}${message.fileUrl}`} type="video/webm" />
        </video>
      );
    }

    return (
      <a
        href={`${API}${message.fileUrl}`}
        target="_blank"
        rel="noreferrer"
        style={{ color: '#00c8ff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        📎 {message.fileName}
        {message.fileSize && (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            ({(message.fileSize / 1024 / 1024).toFixed(1)}MB)
          </span>
        )}
      </a>
    );
  }

  // numai reactiile cu cel putin un user
  const reactionEntries = Object.entries(message.reactions || {}).filter(([, users]) => users.length > 0);

  return (
    <div style={{
      display: 'flex',
      justifyContent: isMine ? 'flex-end' : 'flex-start',
      marginBottom: 12,
      position: 'relative',
    }}
      className="group"
    >
      {/* avatar cealalta persoana */}
      {!isMine && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0066ff, #00c8ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: 'white',
          flexShrink: 0, marginRight: 8, alignSelf: 'flex-end', marginBottom: 4,
          overflow: 'hidden',
        }}>
          {message.sender.avatarUrl ? (
            <img
              src={getAvatarUrl(message.sender.avatarUrl) || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt=""
            />
          ) : message.sender.username[0].toUpperCase()}
        </div>
      )}

      <div style={{ maxWidth: '65%', position: 'relative' }}>
        {/* bubble */}
        <div style={{
          padding: '10px 14px',
          borderRadius: 16,
          ...(isMine ? {
            background: 'linear-gradient(135deg, rgba(0,150,255,0.4), rgba(0,200,255,0.3))',
            border: '1px solid rgba(0,200,255,0.3)',
            borderBottomRightRadius: 4,
            color: '#e8f8ff',
          } : {
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(0,200,255,0.12)',
            borderBottomLeftRadius: 4,
            color: '#d0e8ff',
          }),
          backdropFilter: 'blur(10px)',
        }}>
          {!isMine && (
            <p style={{ fontSize: 11, fontWeight: 600, color: '#00c8ff', margin: '0 0 4px' }}>
              {message.sender.username}
            </p>
          )}
          {renderContent()}
          {!message.deletedAt && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
              <p style={{ fontSize: 10, color: isMine ? 'rgba(0,200,255,0.5)' : 'rgba(255,255,255,0.3)', margin: 0 }}>
                {formatTime(message.createdAt)}
              </p>
              {isMine && isLast && (
                <span style={{ fontSize: 10, color: isSeen ? '#00c8ff' : 'rgba(255,255,255,0.3)' }}>
                  {isSeen ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* reactions */}
        {reactionEntries.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4,
            justifyContent: isMine ? 'flex-end' : 'flex-start',
          }}>
            {reactionEntries.map(([emoji, users]) => {
              const isMyReaction = users.some((u) => u.userId === user?.id);
              return (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  style={{
                    background: isMyReaction ? 'rgba(0,200,255,0.15)' : 'rgba(0,200,255,0.06)',
                    border: `1px solid ${isMyReaction ? 'rgba(0,200,255,0.4)' : 'rgba(0,200,255,0.15)'}`,
                    borderRadius: 100,
                    padding: '2px 8px',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {emoji}
                  <span style={{ color: 'rgba(0,200,255,0.7)', fontSize: 11 }}>{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* action buttons — apar la hover, pozitionate in interiorul bubble-ului */}
        {!message.deletedAt && (
          <div
            className="opacity-0 group-hover:opacity-100"
            style={{
              position: 'absolute',
              top: -30,
              right: isMine ? 0 : 'auto',
              left: isMine ? 'auto' : 0,
              display: 'flex',
              gap: 4,
              transition: 'opacity 0.15s',
            }}
          >
            {/* emoji picker */}
            <div ref={emojiRef} style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowEmojis(!showEmojis); setShowMenu(false); }}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(10,16,32,0.9)',
                  border: '1px solid rgba(0,200,255,0.2)',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                😊
              </button>
              {showEmojis && (
                <div style={{
                  position: 'absolute',
                  top: 32,
                  left: isMine ? 'auto' : 0,
                  right: isMine ? 0 : 'auto',
                  background: 'rgba(10,16,32,0.98)',
                  border: '1px solid rgba(0,200,255,0.2)',
                  borderRadius: 12,
                  padding: 8,
                  display: 'flex', gap: 4,
                  zIndex: 100,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(20px)',
                  whiteSpace: 'nowrap',
                }}>
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => { e.stopPropagation(); handleEmojiClick(emoji); }}
                      style={{
                        fontSize: 20,
                        background: myCurrentReaction === emoji ? 'rgba(0,200,255,0.15)' : 'none',
                        border: myCurrentReaction === emoji ? '1px solid rgba(0,200,255,0.3)' : '1px solid transparent',
                        borderRadius: 6,
                        cursor: 'pointer',
                        padding: '2px 4px',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* context menu */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowEmojis(false); }}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(10,16,32,0.9)',
                  border: '1px solid rgba(0,200,255,0.2)',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ⋯
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: 32,
                  left: isMine ? 'auto' : 0,
                  right: isMine ? 0 : 'auto',
                  background: 'rgba(10,16,32,0.98)',
                  border: '1px solid rgba(0,200,255,0.2)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  zIndex: 100,
                  minWidth: 130,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(20px)',
                }}>
                  {onReply && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onReply(message); setShowMenu(false); }}
                      style={{ width: '100%', padding: '9px 14px', textAlign: 'left', fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,200,255,0.06)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                    >
                      ↩ Reply
                    </button>
                  )}
                  {message.messageType === 'TEXT' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copyText(); }}
                      style={{ width: '100%', padding: '9px 14px', textAlign: 'left', fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,200,255,0.06)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                    >
                      📋 Copy
                    </button>
                  )}
                  {isMine && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMessage(message.id); setShowMenu(false); }}
                      style={{ width: '100%', padding: '9px 14px', textAlign: 'left', fontSize: 13, color: 'rgba(239,68,68,0.8)', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                    >
                      🗑 Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}