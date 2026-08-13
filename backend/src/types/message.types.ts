export interface SendMessageInput {
  conversationId: string;
  content: string;
}

export interface StartConversationInput {
  targetUserId: string;
}