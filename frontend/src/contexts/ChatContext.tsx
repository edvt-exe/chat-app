import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, Message, Story, Notification } from '../types';
import { getSocket } from '../services/socket';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  stories: Story[];
  notifications: Notification[];
  unreadCounts: Record<string, number>;
  pinnedChats: string[];
  mutedChats: string[];
  
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (msg: Message | null) => void;
  editMessage: (messageId: string, content: string) => void;

  forwardingMessage: Message | null;
  setForwardingMessage: (msg: Message | null) => void;
  forwardMessage: (msg: Message, targetConversationId: string) => void;

  setActiveConversation: (conv: Conversation) => void;
  sendMessage: (content: string) => void;
  sendFile: (file: File) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => void;
  reactToStory: (storyId: string, emoji: string) => void;
  startConversation: (targetUserId: string) => Promise<void>;
  createGroup: (name: string, participantIds: string[]) => Promise<void>;
  togglePin: (conversationId: string) => void;
  toggleMute: (conversationId: string) => void;
  loadStories: () => Promise<void>;
  loadConversations: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markNotificationsRead: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

function playNotifSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {}
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const [pinnedChats, setPinnedChats] = useState<string[]>(JSON.parse(localStorage.getItem('pinnedChats') || '[]'));
  const [mutedChats, setMutedChats] = useState<string[]>(JSON.parse(localStorage.getItem('mutedChats') || '[]'));

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  const activeConvRef = useRef<Conversation | null>(null);
  const mutedChatsRef = useRef<string[]>(mutedChats);

  useEffect(() => {
    mutedChatsRef.current = mutedChats;
    localStorage.setItem('mutedChats', JSON.stringify(mutedChats));
  }, [mutedChats]);

  useEffect(() => {
    localStorage.setItem('pinnedChats', JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  async function loadConversations() {
    try {
      const { data } = await api.get('/api/users/conversations');
      setConversations(data);
    } catch (err) {}
  }

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleNewMessage(message: Message) {
      const isActive = activeConvRef.current?.id === message.conversationId;
      if (isActive) {
        setMessages((prev) => {
          const filtered = prev.filter(m => !m.id.toString().startsWith('temp-') && m.id !== message.id);
          return [...filtered, message];
        });
        getSocket()?.emit('message:read', { conversationId: message.conversationId });
      } else {
        if (!mutedChatsRef.current.includes(message.conversationId)) {
           setUnreadCounts((prev) => ({ ...prev, [message.conversationId]: (prev[message.conversationId] || 0) + 1 }));
        }
      }
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === message.conversationId);
        if (exists) return [{ ...exists, messages: [message] }, ...prev.filter((c) => c.id !== message.conversationId)];
        loadConversations();
        return prev;
      });
    }

    function handleMessageEdited({ messageId, content, isEdited }: any) {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, content, isEdited } : m));
    }

    function handleNewConversation(conversation: Conversation) {
      setConversations((prev) => [conversation, ...prev.filter(c => c.id !== conversation.id)]);
    }

    function handleMessageDeleted({ messageId }: { messageId: string }) {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: null } : m));
    }

    function handleMessageSeen({ conversationId, userId: seenByUserId }: any) {
      setMessages((prev) => prev.map((m) => m.conversationId === conversationId ? { ...m, seenBy: [...(m.seenBy || []), seenByUserId] } : m));
    }

    function handleNotificationMessage(data: any) {
      if (mutedChatsRef.current.includes(data.conversationId)) return;
      playNotifSound();
      const notif: Notification = { id: Date.now().toString(), type: 'message', senderName: data.senderName, content: data.content, conversationId: data.conversationId, timestamp: new Date(), read: false };
      setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
      if (Notification.permission === 'granted') new Notification(`${data.senderName}`, { body: data.content, icon: '/favicon.svg' });
    }

    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:seen', handleMessageSeen);
    socket.on('conversation:new', handleNewConversation);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('notification:message', handleNotificationMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:seen', handleMessageSeen);
      socket.off('conversation:new', handleNewConversation);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('notification:message', handleNotificationMessage);
    };
  }, []);

  function setActiveConversation(conv: Conversation) {
    activeConvRef.current = conv;
    setActiveConversationState(conv);
    setMessages([]);
    setUnreadCounts((prev) => { const next = { ...prev }; delete next[conv.id]; return next; });
    getSocket()?.emit('conversation:history', { conversationId: conv.id }, (res: any) => { if (res.success) setMessages(res.messages); });
  }

  function sendMessage(content: string) {
    if (!activeConvRef.current || !user) return;
    const convId = activeConvRef.current.id;

    const tempMessage: any = {
      id: `temp-${Date.now()}`, conversationId: convId, senderId: user.id,
      content, messageType: 'TEXT', fileUrl: null, fileName: null, fileSize: null,
      createdAt: new Date().toISOString(), editedAt: null, deletedAt: null,
      sender: user, reactions: {}, seenBy: [user.id], isEdited: false,
      replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.content, messageType: replyingTo.messageType, sender: { username: replyingTo.sender.username } } : null
    };

    setMessages((prev) => [...prev, tempMessage]);
    getSocket()?.emit('message:send', { conversationId: convId, content, replyToId: replyingTo?.id });
    setReplyingTo(null);
  }

  function forwardMessage(msg: Message, targetConversationId: string) {
    if (!user) return;
    const tempId = `temp-${Date.now()}`;
    const tempMessage: any = {
      ...msg, id: tempId, conversationId: targetConversationId, senderId: user.id,
      createdAt: new Date().toISOString(), editedAt: null, deletedAt: null,
      sender: user, reactions: {}, seenBy: [user.id], isEdited: false, replyTo: null
    };

    if (activeConvRef.current?.id === targetConversationId) {
      setMessages((prev) => [...prev, tempMessage]);
    }

    if (msg.messageType === 'TEXT') {
      getSocket()?.emit('message:send', { conversationId: targetConversationId, content: msg.content });
    } else {
      getSocket()?.emit('message:sendFile', { 
        conversationId: targetConversationId, fileUrl: msg.fileUrl, fileName: msg.fileName, fileSize: msg.fileSize, messageType: msg.messageType 
      });
    }
    setForwardingMessage(null);
  }

  function editMessage(messageId: string, content: string) {
    setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, content, isEdited: true } : m));
    getSocket()?.emit('message:edit', { messageId, content });
    setEditingMessage(null);
  }

  async function sendFile(file: File) {
    if (!activeConvRef.current || !user) return;
    const convId = activeConvRef.current.id;
    let msgType = 'FILE';
    if (file.type.startsWith('image/')) msgType = 'IMAGE';
    else if (file.type.startsWith('video/')) msgType = 'VIDEO';
    else if (file.type.startsWith('audio/')) msgType = 'AUDIO';

    const tempId = `temp-${Date.now()}`;
    const tempUrl = URL.createObjectURL(file);
    const tempMessage: any = {
      id: tempId, conversationId: convId, senderId: user.id,
      content: null, messageType: msgType as any, fileUrl: tempUrl, fileName: file.name, fileSize: file.size,
      createdAt: new Date().toISOString(), editedAt: null, deletedAt: null,
      sender: user, reactions: {}, seenBy: [user.id]
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/api/upload', formData);
      getSocket()?.emit('message:sendFile', { conversationId: convId, ...data });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  function togglePin(conversationId: string) { setPinnedChats(prev => prev.includes(conversationId) ? prev.filter(id => id !== conversationId) : [...prev, conversationId]); }
  function toggleMute(conversationId: string) { setMutedChats(prev => prev.includes(conversationId) ? prev.filter(id => id !== conversationId) : [...prev, conversationId]); }

  async function createGroup(name: string, participantIds: string[]) {
    getSocket()?.emit('conversation:createGroup', { name, participantIds }, (res: any) => {
      if (res.success) { setConversations((prev) => [res.conversation, ...prev]); setActiveConversation(res.conversation); }
    });
  }

  async function startConversation(targetUserId: string) {
    getSocket()?.emit('conversation:start', { targetUserId }, (res: any) => {
      if (!res.success) return;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === res.conversation.id);
        if (exists) { setActiveConversation(exists); return prev; }
        setActiveConversation(res.conversation); return [res.conversation, ...prev];
      });
    });
  }

  async function deleteMessage(messageId: string) {
    try {
      await api.delete(`/api/messages/${messageId}`);
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: null } : m));
      getSocket()?.emit('message:delete', { messageId });
    } catch (error) {}
  }

  return (
    <ChatContext.Provider value={{
        conversations, activeConversation, messages, stories, notifications, unreadCounts, pinnedChats, mutedChats,
        replyingTo, setReplyingTo, editingMessage, setEditingMessage, editMessage, forwardingMessage, setForwardingMessage, forwardMessage,
        setActiveConversation, sendMessage, sendFile, toggleReaction: () => {}, reactToStory: () => {}, 
        startConversation, createGroup, togglePin, toggleMute, loadStories: async () => {}, loadConversations, deleteMessage, markNotificationsRead: () => {},
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