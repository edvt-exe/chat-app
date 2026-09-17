import { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Conversation } from '../../types';
import UserSearch from './UserSearch';
import SettingsPanel from '../settings/SettingsPanel';
import NotificationBell from '../ui/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const API = 'http://localhost:3000';

function getAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API}${url}`;
}

export default function Sidebar() {
  const { conversations, setActiveConversation, activeConversation, unreadCounts, pinnedChats, mutedChats, togglePin, toggleMute, createGroup } = useChat();
  const { user, logout } = useAuth();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = pinnedChats.includes(a.id);
    const bPinned = pinnedChats.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    const aTime = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : new Date(a.createdAt).getTime();
    const bTime = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

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

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const delay = setTimeout(async () => {
      const { data } = await api.get(`/api/users/search?q=${searchQ}`);
      setSearchResults(data);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQ]);

  function handleCreateGroup() {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    createGroup(groupName.trim(), selectedUsers.map(u => u.id));
    setShowCreateGroup(false);
    setGroupName('');
    setSelectedUsers([]);
    setSearchQ('');
  }

  return (
    <>
      <div className="w-[280px] shrink-0 flex flex-col h-screen bg-ios-bg border-r border-ios-border relative">
        <div className="px-4 py-4 border-b border-ios-border flex items-center justify-between shrink-0">
          <span className="text-[20px] font-bold text-ios-text-main tracking-tight">Chats</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowCreateGroup(true)} className="w-8 h-8 rounded-full bg-ios-input text-ios-text-sec hover:text-white flex items-center justify-center transition-colors" title="Create Group">
              👥
            </button>
            <NotificationBell />
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-full bg-ios-input text-ios-text-sec hover:text-white flex items-center justify-center transition-colors">
              ⚙
            </button>
            <button onClick={() => setShowLogoutConfirm(true)} className="w-8 h-8 rounded-full bg-ios-input text-ios-text-sec hover:text-ios-red flex items-center justify-center transition-colors">
              ⏻
            </button>
          </div>
        </div>

        <UserSearch />

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {sortedConversations.length === 0 ? (
            <div className="text-center py-10 px-4"><p className="text-[13px] text-ios-text-sec">No conversations yet</p></div>
          ) : sortedConversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isActive = conv.id === activeConversation?.id;
            const unread = unreadCounts[conv.id] || 0;
            const isPinned = pinnedChats.includes(conv.id);
            const isMuted = mutedChats.includes(conv.id);

            return (
              <div key={conv.id} className="relative group mb-1">
                <button
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive ? 'bg-ios-blue text-white' : 'hover:bg-ios-input'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-ios-hover flex items-center justify-center text-[16px] font-semibold text-white overflow-hidden border border-ios-border/50">
                      {conv.isGroup ? '👥' : (
                        other?.avatarUrl ? <img src={getAvatarUrl(other.avatarUrl) || ''} className="w-full h-full object-cover" alt="" /> : (other?.username || '?')[0].toUpperCase()
                      )}
                    </div>
                    {other?.isOnline && !conv.isGroup && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-ios-green border-[2.5px] border-ios-bg" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className={`text-[15px] font-semibold truncate flex items-center gap-1 ${isActive ? 'text-white' : 'text-ios-text-main'}`}>
                        {getConversationName(conv)}
                        {isMuted && <span className="text-[11px] opacity-70">🔕</span>}
                        {isPinned && <span className="text-[11px] opacity-70">📌</span>}
                      </p>
                      {unread > 0 && !isMuted && (
                        <span className={`px-1.5 min-w-[18px] h-[18px] rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ml-2 ${
                          isActive ? 'bg-white text-ios-blue' : 'bg-ios-blue text-white'
                        }`}>
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-[13px] truncate ${isActive ? 'text-white/80' : (unread > 0 && !isMuted ? 'text-ios-text-main font-medium' : 'text-ios-text-sec')}`}>
                      {getLastMessage(conv)}
                    </p>
                  </div>
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === conv.id ? null : conv.id); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ios-hover/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md backdrop-blur-md transition-opacity"
                >
                  •••
                </button>

                {menuOpenId === conv.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-3 top-10 w-[140px] bg-ios-card border border-ios-border rounded-xl shadow-2xl z-50 py-1">
                      <button onClick={() => { togglePin(conv.id); setMenuOpenId(null); }} className="w-full px-4 py-2 text-left text-[14px] text-white hover:bg-ios-hover">
                        {isPinned ? 'Unpin Chat' : '📌 Pin Chat'}
                      </button>
                      <button onClick={() => { toggleMute(conv.id); setMenuOpenId(null); }} className="w-full px-4 py-2 text-left text-[14px] text-white hover:bg-ios-hover">
                        {isMuted ? 'Unmute' : '🔕 Mute'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-ios-border flex items-center gap-3 shrink-0 bg-ios-card/50">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-ios-hover flex items-center justify-center text-[13px] font-semibold text-white overflow-hidden">
              {user?.avatarUrl ? <img src={getAvatarUrl(user.avatarUrl) || ''} className="w-full h-full object-cover" alt="" /> : (user?.username || 'U')[0].toUpperCase()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ios-text-main truncate">{user?.username}</p>
            <p className="text-[11px] text-ios-text-sec truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      
      {/* Modal Create Group */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-[400px] bg-ios-card rounded-[24px] overflow-hidden shadow-2xl border border-ios-border flex flex-col max-h-[85vh]">
              
              <div className="px-5 py-4 border-b border-ios-border flex justify-between items-center bg-ios-bg/50">
                <h2 className="text-[17px] font-semibold text-white">New Group</h2>
                <button onClick={() => setShowCreateGroup(false)} className="text-ios-text-sec hover:text-white">✕</button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto">
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group Name..." className="w-full bg-ios-input text-white px-4 py-3 rounded-xl outline-none mb-4 font-semibold border border-ios-border/50 focus:border-ios-blue" />
                
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-1.5 bg-ios-blue/20 text-ios-blue px-3 py-1.5 rounded-full text-[13px] font-medium border border-ios-blue/30">
                        {u.username} <button onClick={() => setSelectedUsers(prev => prev.filter(x => x.id !== u.id))} className="text-white hover:text-red-400">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative mb-2">
                  <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Add members..." className="w-full bg-ios-bg text-white px-4 py-2.5 rounded-xl outline-none border border-ios-border/50 text-[14px]" />
                </div>
                
                <div className="space-y-1">
                  {searchResults.map(u => {
                    const isSelected = selectedUsers.some(x => x.id === u.id);
                    return (
                      <button key={u.id} onClick={() => !isSelected && setSelectedUsers(prev => [...prev, u])} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${isSelected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ios-hover'}`}>
                        <span className="text-[15px] text-white font-medium">{u.username}</span>
                        {isSelected ? <span className="text-ios-blue">✓</span> : <span className="text-ios-text-sec text-[20px]">+</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-ios-border bg-ios-bg/50">
                <button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedUsers.length === 0} className="w-full bg-ios-blue text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 transition-opacity">
                  Create Group
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}