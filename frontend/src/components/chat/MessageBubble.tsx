import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏'];
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

  function handleEmojiClick(emoji: string) {
    if (myCurrentReaction && myCurrentReaction !== emoji) toggleReaction(message.id, myCurrentReaction);
    toggleReaction(message.id, emoji);
    setShowEmojis(false);
  }

  function renderContent() {
    if (message.deletedAt) return <p className="text-[15px] italic opacity-50">Message unsent</p>;
    if (message.messageType === 'TEXT') return <p className="text-[16px] leading-[1.35] whitespace-pre-wrap m-0 break-words">{message.content}</p>;
    if (message.messageType === 'IMAGE') return <img src={`${API}${message.fileUrl}`} className="max-w-[220px] rounded-xl cursor-pointer block" onClick={() => window.open(`${API}${message.fileUrl}`, '_blank')} alt="" />;
    if (message.messageType === 'VIDEO') return <video controls className="max-w-[220px] rounded-xl max-h-[280px]"><source src={`${API}${message.fileUrl}`} /></video>;
    return (
      <a href={`${API}${message.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[15px] underline">
        📎 {message.fileName}
      </a>
    );
  }

  const reactionEntries = Object.entries(message.reactions || {}).filter(([, users]) => users.length > 0);

  return (
    <div className={`flex w-full mb-4 group ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        
        {/* Bubble */}
        <div className={`px-4 py-2.5 rounded-[20px] ${
          isMine 
            ? 'bg-ios-blue text-white rounded-br-[4px]' 
            : 'bg-ios-input text-white rounded-bl-[4px]'
        }`}>
          {renderContent()}
        </div>

        {/* Timestamps & Reactions */}
        <div className={`flex items-center mt-1 gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
          {!message.deletedAt && (
             <span className="text-[11px] text-ios-text-sec">{formatTime(message.createdAt)}</span>
          )}
          {isMine && isLast && !message.deletedAt && (
             <span className="text-[11px] text-ios-text-sec">{isSeen ? 'Read' : 'Delivered'}</span>
          )}
        </div>

        {reactionEntries.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {reactionEntries.map(([emoji, users]) => (
              <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="bg-ios-card border border-ios-border rounded-full px-2 py-0.5 text-[12px] flex items-center gap-1">
                {emoji} <span className="text-ios-text-sec text-[10px]">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hover Actions */}
        {!message.deletedAt && (
          <div className={`absolute top-0 ${isMine ? '-left-14' : '-right-14'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
             <div ref={emojiRef} className="relative">
                <button onClick={() => { setShowEmojis(!showEmojis); setShowMenu(false); }} className="w-6 h-6 rounded-full bg-ios-input text-ios-text-sec flex items-center justify-center text-[12px]">☺</button>
                {showEmojis && (
                  <div className="absolute top-8 z-50 bg-ios-card border border-ios-border rounded-2xl p-2 flex gap-1 shadow-xl">
                    {EMOJIS.map(e => <button key={e} onClick={() => handleEmojiClick(e)} className="text-[18px] hover:scale-125 transition-transform">{e}</button>)}
                  </div>
                )}
             </div>
             <div ref={menuRef} className="relative">
                <button onClick={() => { setShowMenu(!showMenu); setShowEmojis(false); }} className="w-6 h-6 rounded-full bg-ios-input text-ios-text-sec flex items-center justify-center text-[12px]">⋯</button>
                {showMenu && (
                  <div className="absolute top-8 z-50 bg-ios-card border border-ios-border rounded-xl overflow-hidden shadow-xl min-w-[120px]">
                    {message.messageType === 'TEXT' && (
                      <button onClick={() => { navigator.clipboard.writeText(message.content || ''); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-[14px] text-white hover:bg-ios-hover">Copy</button>
                    )}
                    {isMine && (
                      <button onClick={() => { deleteMessage(message.id); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-[14px] text-ios-red hover:bg-ios-hover border-t border-ios-border">Unsend</button>
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