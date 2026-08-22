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
  setActiveConversation: (conv: Conversation) => void;
  sendMessage: (content: string) => void;
  sendFile: (file: File) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => void;
  reactToStory: (storyId: string, emoji: string) => void;
  startConversation: (targetUserId: string) => Promise<void>;
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
    oscillator.frequency.exponentialRampToValueAtTime(
      440,
      ctx.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.3
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // browser poate bloca AudioContext fara interactiune utilizator
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const activeConvRef = useRef<Conversation | null>(null);

  async function loadConversations() {
    try {
      const { data } = await api.get('/api/users/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }

  useEffect(() => {
    if (!user) return;

    loadConversations();
  }, [user]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    function handleNewMessage(message: Message) {
      const isActive =
        activeConvRef.current?.id === message.conversationId;

      if (isActive) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) {
            return prev;
          }

          return [...prev, message];
        });

        // Marca mesajul ca vazut daca suntem in conversatie
        const currentSocket = getSocket();

        currentSocket?.emit('message:read', {
          conversationId: message.conversationId,
        });
      } else {
        // Incrementeaza unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversationId]:
            (prev[message.conversationId] || 0) + 1,
        }));
      }

      setConversations((prev) => {
        const exists = prev.find(
          (c) => c.id === message.conversationId
        );

        if (exists) {
          return [
            { ...exists, messages: [message] },
            ...prev.filter((c) => c.id !== message.conversationId),
          ];
        }

        loadConversations();
        return prev;
      });
    }

    function handleNotificationMessage(data: any) {
      playNotifSound();

      const notif: Notification = {
        id: Date.now().toString(),
        type: 'message',
        senderName: data.senderName,
        content: data.content,
        conversationId: data.conversationId,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [
        notif,
        ...prev.slice(0, 19),
      ]);

      if (Notification.permission === 'granted') {
        new Notification(`${data.senderName}`, {
          body: data.content,
          icon: '/favicon.svg',
        });
      }
    }

    function handleNotificationReaction(data: any) {
      const notif: Notification = {
        id: Date.now().toString(),
        type:
          data.type === 'story'
            ? 'story_reaction'
            : 'reaction',
        senderName: data.senderName,
        emoji: data.emoji,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [
        notif,
        ...prev.slice(0, 19),
      ]);
    }

    function handleReactionUpdated({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: any;
    }) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions }
            : m
        )
      );
    }

    function handleMessageSeen({
      conversationId,
      userId: seenByUserId,
    }: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === conversationId
            ? {
                ...m,
                seenBy: [
                  ...(m.seenBy || []),
                  seenByUserId,
                ],
              }
            : m
        )
      );
    }

    function handleStoryNew(story: Story) {
      setStories((prev) => [story, ...prev]);
    }

    socket.on('message:new', handleNewMessage);
    socket.on(
      'notification:message',
      handleNotificationMessage
    );
    socket.on(
      'notification:reaction',
      handleNotificationReaction
    );
    socket.on(
      'reaction:updated',
      handleReactionUpdated
    );
    socket.on(
      'message:seen',
      handleMessageSeen
    );
    socket.on('story:new', handleStoryNew);

    return () => {
      socket.off(
        'message:new',
        handleNewMessage
      );
      socket.off(
        'notification:message',
        handleNotificationMessage
      );
      socket.off(
        'notification:reaction',
        handleNotificationReaction
      );
      socket.off(
        'reaction:updated',
        handleReactionUpdated
      );
      socket.off(
        'message:seen',
        handleMessageSeen
      );
      socket.off(
        'story:new',
        handleStoryNew
      );
    };
  }, []);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  function setActiveConversation(conv: Conversation) {
    activeConvRef.current = conv;
    setActiveConversationState(conv);
    setMessages([]);

    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[conv.id];
      return next;
    });

    const socket = getSocket();

    if (!socket) return;

    socket.emit(
      'conversation:history',
      { conversationId: conv.id },
      (res: any) => {
        if (res.success) {
          setMessages(res.messages);
        }
      }
    );
  }

  function sendMessage(content: string) {
    if (!activeConvRef.current) return;

    const socket = getSocket();

    socket?.emit('message:send', {
      conversationId: activeConvRef.current.id,
      content,
    });
  }

  async function sendFile(file: File) {
    if (!activeConvRef.current) return;

    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post(
      '/api/upload',
      formData
    );

    const socket = getSocket();

    socket?.emit('message:sendFile', {
      conversationId: activeConvRef.current.id,
      ...data,
    });
  }

  function toggleReaction(
    messageId: string,
    emoji: string
  ) {
    const socket = getSocket();

    socket?.emit('reaction:toggle', {
      messageId,
      emoji,
    });
  }

  function reactToStory(
    storyId: string,
    emoji: string
  ) {
    const socket = getSocket();

    socket?.emit('story:react', {
      storyId,
      emoji,
    });
  }

  async function startConversation(
    targetUserId: string
  ) {
    const socket = getSocket();

    if (!socket) return;

    socket.emit(
      'conversation:start',
      { targetUserId },
      (res: any) => {
        if (!res.success) return;

        setConversations((prev) => {
          const exists = prev.find(
            (c) => c.id === res.conversation.id
          );

          if (exists) {
            setActiveConversation(exists);
            return prev;
          }

          setActiveConversation(
            res.conversation
          );

          return [
            res.conversation,
            ...prev,
          ];
        });
      }
    );
  }

  async function loadStories() {
    try {
      const { data } = await api.get(
        '/api/stories'
      );

      setStories(data);
    } catch {
      // ignore
    }
  }

  async function deleteMessage(
    messageId: string
  ) {
    await api.delete(
      `/api/messages/${messageId}`
    );

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              deletedAt:
                new Date().toISOString(),
              content: null,
            }
          : m
      )
    );
  }

  function markNotificationsRead() {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
      }))
    );
  }

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        stories,
        notifications,
        unreadCounts,
        setActiveConversation,
        sendMessage,
        sendFile,
        toggleReaction,
        reactToStory,
        startConversation,
        loadStories,
        loadConversations,
        deleteMessage,
        markNotificationsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);

  if (!ctx) {
    throw new Error(
      'useChat must be used inside ChatProvider'
    );
  }

  return ctx;
}