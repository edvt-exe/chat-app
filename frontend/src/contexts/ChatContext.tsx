import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, Message, Story } from '../types';
import { getSocket } from '../services/socket';
import api from '../services/api';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  stories: Story[];
  setActiveConversation: (conv: Conversation) => void;
  sendMessage: (content: string) => void;
  sendFile: (file: File) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => void;
  startConversation: (targetUserId: string) => Promise<void>;
  loadStories: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('message:new', (message: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('reaction:updated', ({ messageId, reactions }: { messageId: string; reactions: any }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, reactions } : m)
      );
    });

    socket.on('story:new', (story: Story) => {
      setStories((prev) => [story, ...prev]);
    });

    return () => {
      socket.off('message:new');
      socket.off('reaction:updated');
      socket.off('story:new');
    };
  }, []);

  function setActiveConversation(conv: Conversation) {
    setActiveConversationState(conv);
    setMessages([]);

    const socket = getSocket();
    if (!socket) return;

    socket.emit('conversation:history', { conversationId: conv.id }, (res: any) => {
      if (res.success) setMessages(res.messages);
    });
  }

  function sendMessage(content: string) {
    if (!activeConversation) return;
    const socket = getSocket();
    socket?.emit('message:send', { conversationId: activeConversation.id, content });
  }

  async function sendFile(file: File) {
    if (!activeConversation) return;

    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/api/upload', formData);
    const socket = getSocket();
    socket?.emit('message:sendFile', {
      conversationId: activeConversation.id,
      ...data,
    });
  }

  function toggleReaction(messageId: string, emoji: string) {
    const socket = getSocket();
    socket?.emit('reaction:toggle', { messageId, emoji });
  }

  async function startConversation(targetUserId: string) {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('conversation:start', { targetUserId }, (res: any) => {
      if (res.success) {
        setConversations((prev) => {
          if (prev.find((c) => c.id === res.conversation.id)) return prev;
          return [res.conversation, ...prev];
        });
        setActiveConversation(res.conversation);
      }
    });
  }

  async function loadStories() {
    const { data } = await api.get('/api/stories');
    setStories(data);
  }

  return (
    <ChatContext.Provider value={{
      conversations, activeConversation, messages, stories,
      setActiveConversation, sendMessage, sendFile, toggleReaction,
      startConversation, loadStories,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}