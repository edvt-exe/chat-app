import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { getSocket } from '../../services/socket';

export default function MessageInput() {
  const { sendMessage, sendFile, activeConversation, replyingTo, setReplyingTo, editingMessage, setEditingMessage, editMessage } = useChat();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (editingMessage) setText(editingMessage.content || '');
    else if (!replyingTo) setText('');
  }, [editingMessage]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;
    
    if (editingMessage) {
      editMessage(editingMessage.id, text.trim());
    } else {
      sendMessage(text.trim());
    }
    
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

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const file = new File([audioBlob], `VoiceMessage-${Date.now()}.webm`, { type: 'audio/webm' });
        sendFile(file);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start(250);
      setIsRecording(true);
    } catch (error) {
      alert("Te rog permite accesul la microfon pentru a trimite mesaje vocale.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  return (
    <div className="relative">
      {(replyingTo || editingMessage) && (
        <div className="absolute bottom-full left-0 right-0 bg-ios-bg/95 backdrop-blur-md px-4 py-2 border-t border-ios-border flex items-center justify-between z-10 text-[13px] transition-all">
          <div className="flex flex-col">
            <span className="font-semibold text-ios-blue">
              {editingMessage ? '✏️ Editing Message' : `↩️ Replying to ${replyingTo?.sender.username}`}
            </span>
            <span className="truncate max-w-[250px] text-ios-text-sec">
              {editingMessage ? editingMessage.content : replyingTo?.content || `[${replyingTo?.messageType}]`}
            </span>
          </div>
          <button type="button" onClick={() => { setReplyingTo(null); setEditingMessage(null); setText(''); }} className="w-7 h-7 rounded-full bg-ios-input flex items-center justify-center hover:bg-ios-hover text-ios-text-sec transition-colors">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 bg-ios-bg border-t border-ios-border relative z-20">
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
        <button type="button" onClick={() => fileRef.current?.click()} className="w-8 h-8 rounded-full bg-ios-input text-ios-text-sec flex items-center justify-center shrink-0 hover:text-white transition-colors" disabled={isRecording || !!editingMessage}>
          +
        </button>

        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-1.5 rounded-full bg-ios-input border border-ios-red/50">
            <div className="w-2.5 h-2.5 rounded-full bg-ios-red animate-pulse" />
            <span className="text-[15px] text-ios-red font-medium flex-1">Recording...</span>
            <button type="button" onClick={stopRecording} className="text-[13px] font-bold text-white bg-ios-red px-3 py-1 rounded-full">Stop & Send</button>
          </div>
        ) : (
          <input
            value={text}
            onChange={handleTyping}
            placeholder={activeConversation ? 'iMessage' : ''}
            disabled={!activeConversation}
            className="flex-1 rounded-full bg-ios-input px-4 py-1.5 text-[15px] text-white placeholder-ios-text-sec outline-none disabled:opacity-50"
          />
        )}

        {text.trim() ? (
          <button type="submit" className="w-8 h-8 rounded-full bg-ios-blue text-white flex items-center justify-center shrink-0 disabled:opacity-50 transition-transform">↑</button>
        ) : (
          <button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={!activeConversation || !!editingMessage} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isRecording ? 'bg-ios-red text-white' : 'bg-ios-input text-ios-text-sec hover:text-white'}`}>
            🎙
          </button>
        )}
      </form>
    </div>
  );
}