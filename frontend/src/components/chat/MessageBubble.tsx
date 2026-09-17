import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

const API = 'http://localhost:3000';

function formatFileSize(bytes: number | null) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const { deleteMessage } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const isOutgoing = message.senderId === user?.id;
  const isDeleted = Boolean(message.deletedAt);
  const isTemp = message.id.toString().startsWith('temp-');
  const isSeen = (message.seenBy || []).some((id) => id !== user?.id);

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function handleTTS(text: string | null) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ro-RO';
    window.speechSynthesis.speak(utterance);
  }

  function renderMediaContent() {
    if (isDeleted) return <span>🚫 {isOutgoing ? 'You unsent this message' : 'This message was deleted'}</span>;

    const fileUrl = message.fileUrl 
      ? (message.fileUrl.startsWith('blob:') || message.fileUrl.startsWith('http') 
          ? message.fileUrl 
          : `${API}${message.fileUrl}`) 
      : '';

    switch (message.messageType) {
      case 'IMAGE':
        return (
          <>
            <img 
              src={fileUrl} 
              alt="Sent image" 
              className="max-w-full max-h-[250px] rounded-[14px] cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => setIsLightboxOpen(true)}
            />
            {isLightboxOpen && (
              <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
                <button className="absolute top-6 right-6 text-white text-3xl font-light hover:scale-110 transition-transform">✕</button>
                <img src={fileUrl} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
              </div>
            )}
          </>
        );
      case 'VIDEO':
        return (
          <video src={fileUrl} controls preload="metadata" className="max-w-full max-h-[250px] rounded-[14px] bg-black/50" />
        );
      case 'AUDIO':
        return (
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className="text-[12px] font-medium opacity-70 mb-1">🎙 Voice Message</span>
            <audio src={fileUrl} controls preload="metadata" className="h-[36px] w-full" />
          </div>
        );
      case 'FILE':
        return (
          <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-3 rounded-[14px] no-underline hover:bg-black/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-ios-blue text-white flex items-center justify-center text-xl shrink-0">📄</div>
            <div className="flex flex-col min-w-[120px] max-w-[200px]">
              <span className="text-[14px] font-semibold truncate text-white">{message.fileName}</span>
              <span className="text-[12px] opacity-70">{formatFileSize(message.fileSize)}</span>
            </div>
          </a>
        );
      default:
        return (
          <div className="flex items-end gap-2 group/text">
            <span>{message.content}</span>
            <button 
              onClick={() => handleTTS(message.content)} 
              className="opacity-0 group-hover/text:opacity-100 text-[16px] hover:scale-110 transition-all shrink-0 pb-0.5" 
              title="Read aloud"
            >
              🔊
            </button>
          </div>
        );
    }
  }

  return (
    <div className={`flex flex-col mb-2 group ${isOutgoing ? 'items-end' : 'items-start'}`}>
      <div className="relative max-w-[75%] flex items-center gap-2">
        {isOutgoing && !isDeleted && !isTemp && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="opacity-0 group-hover:opacity-100 p-1 text-ios-text-sec hover:text-white transition-opacity text-xs">•••</button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 bottom-6 bg-ios-card border border-ios-border rounded-xl shadow-xl z-20 py-1 min-w-[110px]">
                  <button
                    onClick={() => { deleteMessage(message.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-ios-red hover:bg-ios-input transition-colors font-medium flex items-center gap-1.5"
                  >
                    <span>🗑</span> Unsend
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div
          className={`p-1.5 rounded-[20px] text-[15px] leading-relaxed break-words shadow-sm transition-colors ${
            isDeleted ? 'bg-ios-input/40 text-ios-text-sec italic border border-ios-border/50 px-4 py-2.5'
              : message.messageType === 'TEXT'
              ? (isOutgoing ? 'bg-ios-blue text-white rounded-br-[4px] px-4 py-2.5' : 'bg-ios-input text-white rounded-bl-[4px] px-4 py-2.5')
              : (isOutgoing ? 'bg-ios-blue text-white rounded-br-[4px]' : 'bg-ios-input text-white rounded-bl-[4px]')
          }`}
        >
          {renderMediaContent()}

          <div className={`flex items-center justify-end gap-1 text-[11px] mt-1 px-2 ${isOutgoing ? 'text-white/80' : 'text-ios-text-sec'}`}>
            <span>{formatTime(message.createdAt)}</span>
            {isOutgoing && !isDeleted && (
              <span className="font-bold text-[12px] leading-none">
                {isTemp ? '🕒' : isSeen ? <span className="text-[#47bfff] font-bold tracking-tighter">✓✓</span> : <span className="opacity-70 tracking-tighter">✓✓</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}