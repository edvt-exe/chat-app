import { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Conversation } from '../../types';
import UserSearch from './UserSearch';
import SettingsPanel from '../settings/SettingsPanel';
import NotificationBell from '../ui/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:3000';

function getAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API}${url}`;
}

export default function Sidebar() {
  const { conversations, setActiveConversation, activeConversation, unreadCounts } = useChat();
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
      <div className="w-[280px] shrink-0 flex flex-col h-screen bg-ios-bg border-r border-ios-border transition-colors duration-300">
        {/* Header */}
        <div className="px-4 py-4 border-b border-ios-border flex items-center justify-between shrink-0">
          <span className="text-[20px] font-bold text-ios-text-main tracking-tight">Chats</span>
          <div className="flex items-center gap-2">
            
            {/* Buton Dark Mode */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="w-8 h-8 rounded-full bg-ios-input text-ios-text-sec hover:text-ios-text-main flex items-center justify-center transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>

            <NotificationBell />
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-full bg-ios-input text-ios-text-sec hover:text-ios-text-main flex items-center justify-center transition-colors">
              ⚙
            </button>
            <button onClick={() => setShowLogoutConfirm(true)} className="w-8 h-8 rounded-full bg-ios-input text-ios-text-sec hover:text-ios-red flex items-center justify-center transition-colors">
              ⏻
            </button>
          </div>
        </div>

        <UserSearch />

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-[13px] text-ios-text-sec">No conversations yet</p>
            </div>
          ) : conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isActive = conv.id === activeConversation?.id;
            const unread = unreadCounts[conv.id] || 0;

            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors ${
                  isActive ? 'bg-ios-blue text-white' : 'hover:bg-ios-input'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-ios-hover flex items-center justify-center text-[16px] font-semibold text-white overflow-hidden">
                    {other?.avatarUrl ? (
                      <img src={getAvatarUrl(other.avatarUrl) || ''} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (other?.username || '?')[0].toUpperCase()
                    )}
                  </div>
                  {other?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-ios-green border-[2.5px] border-ios-bg" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className={`text-[15px] font-semibold truncate ${isActive ? 'text-white' : 'text-ios-text-main'}`}>
                      {getConversationName(conv)}
                    </p>
                    {unread > 0 && (
                      <span className={`px-1.5 min-w-[18px] h-[18px] rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ml-2 ${
                        isActive ? 'bg-white text-ios-blue' : 'bg-ios-blue text-white'
                      }`}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                  <p className={`text-[13px] truncate ${isActive ? 'text-white/80' : (unread > 0 ? 'text-ios-text-main font-medium' : 'text-ios-text-sec')}`}>
                    {getLastMessage(conv)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="px-4 py-3 border-t border-ios-border flex items-center gap-3 shrink-0 bg-ios-card/50">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-ios-hover flex items-center justify-center text-[13px] font-semibold text-white overflow-hidden">
              {user?.avatarUrl ? (
                <img src={getAvatarUrl(user.avatarUrl) || ''} className="w-full h-full object-cover" alt="" />
              ) : (
                (user?.username || 'U')[0].toUpperCase()
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ios-text-main truncate">{user?.username}</p>
            <p className="text-[11px] text-ios-text-sec truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-[320px] bg-ios-card rounded-[24px] p-6 text-center shadow-2xl border border-ios-border">
              <h2 className="text-[20px] font-semibold text-ios-text-main tracking-tight">Sign Out</h2>
              <p className="mt-2 text-[15px] text-ios-text-muted leading-snug">Are you sure you want to sign out?</p>
              <div className="mt-6 flex flex-col gap-2">
                <button onClick={() => { logout(); setShowLogoutConfirm(false); }} className="w-full py-3.5 bg-ios-red text-white text-[17px] font-semibold rounded-xl hover:opacity-90 transition-opacity">Sign Out</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-3.5 bg-ios-input text-ios-text-main text-[17px] font-semibold rounded-xl hover:bg-ios-hover transition-colors">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}