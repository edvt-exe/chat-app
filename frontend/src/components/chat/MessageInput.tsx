import { useState, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { getSocket } from '../../services/socket';

export default function MessageInput() {
  const { sendMessage, sendFile, activeConversation } = useChat();
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;
    sendMessage(text.trim());
    setText('');
    const socket = getSocket();
    if (socket) socket.emit('typing:stop', { conversationId: activeConversation.id });
  }

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    const socket = getSocket();
    if (!activeConversation || !socket) return;
    socket.emit('typing:start', { conversationId: activeConversation.id });
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: activeConversation.id });
    }, 1500);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await sendFile(file);
    e.target.value = '';
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 bg-ios-bg">
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
      
      <button type="button" onClick={() => fileRef.current?.click()} className="w-8 h-8 rounded-full bg-ios-input text-ios-text-sec flex items-center justify-center shrink-0">
        +
      </button>

      <input
        value={text}
        onChange={handleTyping}
        placeholder={activeConversation ? 'iMessage' : ''}
        disabled={!activeConversation}
        className="flex-1 rounded-full bg-ios-input px-4 py-1.5 text-[15px] text-white placeholder-ios-text-sec outline-none disabled:opacity-50 border border-ios-border/50"
      />

      <button type="submit" disabled={!text.trim() || !activeConversation} className="w-8 h-8 rounded-full bg-ios-blue text-white flex items-center justify-center shrink-0 disabled:opacity-50">
        ↑
      </button>
    </form>
  );
}