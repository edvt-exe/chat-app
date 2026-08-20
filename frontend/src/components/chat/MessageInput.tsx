import { useState, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';

export default function MessageInput() {
  const { sendMessage, sendFile, activeConversation } = useChat();
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;
    sendMessage(text.trim());
    setText('');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await sendFile(file);
    e.target.value = '';
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 px-4 py-3"
      style={{
        borderTop: '1px solid rgba(0,200,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-colors"
        style={{
          background: 'rgba(0,200,255,0.06)',
          border: '1px solid rgba(0,200,255,0.15)',
          color: 'rgba(0,200,255,0.6)',
        }}
      >
        📎
      </button>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); }
        }}
        placeholder={activeConversation ? 'Type a message...' : 'Select a conversation'}
        disabled={!activeConversation}
        className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors disabled:opacity-40"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,200,255,0.15)',
        }}
      />

      <button
        type="submit"
        disabled={!text.trim() || !activeConversation}
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #0096ff, #00c8ff)' }}
      >
        <span className="text-white text-base">➤</span>
      </button>
    </form>
  );
}