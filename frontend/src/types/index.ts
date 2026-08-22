export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeenAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  reactions: Record<string, { userId: string; username: string }[]>;
  seenBy?: string[];
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: { userId: string; user: User }[];
  messages?: Message[];
  unreadCount?: number;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption: string | null;
  createdAt: string;
  expiresAt: string;
  user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  views: { userId: string }[];
}

export interface Notification {
  id: string;
  type: 'message' | 'reaction' | 'story_reaction';
  senderName: string;
  content?: string;
  emoji?: string;
  conversationId?: string;
  timestamp: Date;
  read: boolean;
}