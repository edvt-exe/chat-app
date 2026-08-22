import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Conversation } from '../../types';
import UserSearch from './UserSearch';
import SettingsPanel from '../settings/SettingsPanel';
import NotificationBell from '../ui/NotificationBell';
import { useState } from 'react';

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
      <div style={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(0,200,255,0.12)',
      }}>
        {/* header */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(0,200,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: -0.5 }}>
            Nexus<span style={{ color: '#00c8ff' }}>Chat</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <NotificationBell />
            <button onClick={() => setShowSettings(true)}
              style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.15)', color: 'rgba(0,200,255,0.6)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⚙
            </button>
            <button onClick={() => setShowLogoutConfirm(true)}
              style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.15)', color: 'rgba(255,80,80,0.7)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⏻
            </button>
          </div>
        </div>

        <UserSearch />

        {/* conversations list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ fontSize: 28, margin: '0 0 8px' }}>💬</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Search for a user to start chatting</p>
            </div>
          ) : conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isActive = conv.id === activeConversation?.id;
            const unread = unreadCounts[conv.id] || 0;

            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 10px', borderRadius: 10, marginBottom: 2,
                  background: isActive ? 'rgba(0,200,255,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,200,255,0.2)' : '1px solid transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0066ff, #00c8ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 600, color: 'white', overflow: 'hidden',
                  }}>
                    {other?.avatarUrl ? (
                      <img src={getAvatarUrl(other.avatarUrl) || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    ) : (
                      (other?.username || '?')[0].toUpperCase()
                    )}
                  </div>
                  {other?.isOnline && (
                    <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22d46a', border: '2px solid #060b14' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getConversationName(conv)}
                    </p>
                    {unread > 0 && (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 100,
                        background: '#00c8ff', color: '#060b14',
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px', flexShrink: 0, marginLeft: 4,
                      }}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: unread > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread > 0 ? 500 : 400 }}>
                    {getLastMessage(conv)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* user footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(0,200,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0066ff, #00c8ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden',
            }}>
              {user?.avatarUrl ? (
                <img src={getAvatarUrl(user.avatarUrl) || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              ) : (
                (user?.username || 'U')[0].toUpperCase()
              )}
            </div>
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#22d46a', border: '2px solid #060b14' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
            <p style={{ fontSize: 10, color: '#22d46a', margin: 0 }}>Online</p>
          </div>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 300, borderRadius: 20, padding: 24, textAlign: 'center', background: '#0a1020', border: '1px solid rgba(0,200,255,0.15)' }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Sign out?</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px' }}>
              You'll need to sign in again to access your messages.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => { logout(); setShowLogoutConfirm(false); }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(239,68,68,0.8)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}