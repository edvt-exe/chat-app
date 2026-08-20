import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Conversation } from '../../types';
import Avatar from '../ui/Avatar';
import UserSearch from './UserSearch';
import SettingsPanel from '../settings/SettingsPanel';

export default function Sidebar() {
  const { conversations, setActiveConversation, activeConversation } = useChat();
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function getOtherParticipant(conv: Conversation) {
    return conv.participants?.find((p) => p.userId !== user?.id)?.user;
  }

  function getConversationName(conv: Conversation) {
    if (conv.name) return conv.name;
    return getOtherParticipant(conv)?.username || 'Unknown';
  }

  function getLastMessage(conv: Conversation) {
    const msgs = conv.messages;
    if (!msgs || msgs.length === 0) return 'No messages yet';
    const last = msgs[0];
    if (last.messageType !== 'TEXT') return `📎 ${last.fileName || 'File'}`;
    return last.content || '';
  }

  return (
    <>
      <div
        className="w-64 flex-shrink-0 flex flex-col h-full"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0,200,255,0.12)',
        }}
      >
        <div
          className="px-4 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,200,255,0.08)' }}
        >
          <span className="text-lg font-bold text-white tracking-tight">
            Nexus<span style={{ color: '#00c8ff' }}>Chat</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
              style={{ background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.15)', color: 'rgba(0,200,255,0.6)' }}
              title="Settings"
            >
              ⚙
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
              style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.15)', color: 'rgba(255,80,80,0.7)' }}
              title="Logout"
            >
              ⏻
            </button>
          </div>
        </div>

        <UserSearch />

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Search for a user above to start chatting.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isActive = conv.id === activeConversation?.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all text-left"
                  style={{
                    background: isActive ? 'rgba(0,200,255,0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(0,200,255,0.2)' : '1px solid transparent',
                  }}
                >
                  {other ? (
                    <Avatar
                      user={{ username: other.username, avatarUrl: other.avatarUrl, isOnline: other.isOnline }}
                      size="md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: 'rgba(0,200,255,0.1)', color: '#00c8ff' }}>
                      👥
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{getConversationName(conv)}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {getLastMessage(conv)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div
          className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(0,200,255,0.08)' }}
        >
          <Avatar
            user={{ username: user?.username || '', avatarUrl: user?.avatarUrl || null, isOnline: true }}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
            <p className="text-xs" style={{ color: '#22d46a' }}>Online</p>
          </div>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-xs rounded-2xl p-6 text-center"
            style={{ background: '#0a1020', border: '1px solid rgba(0,200,255,0.15)' }}>
            <p className="text-lg font-semibold text-white mb-2">Sign out?</p>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              You'll need to sign in again to access your messages.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { logout(); setShowLogoutConfirm(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'rgba(239,68,68,0.8)' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}