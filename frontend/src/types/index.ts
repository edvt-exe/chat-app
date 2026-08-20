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
  sender: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  reactions: Record<string, { userId: string; username: string }[]>;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: { userId: string; user: User }[];
  messages?: Message[];
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