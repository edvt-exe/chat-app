import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import type { Notification } from '../../types';

export default function NotificationBell() {
  const { notifications, markNotificationsRead } = useChat();
  const [open, setOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  function toggle() {
    setOpen((v) => !v);
    if (!open) markNotificationsRead();
  }

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getIcon(n: Notification) {
    if (n.type === 'message') return '💬';
    if (n.type === 'reaction') return n.emoji || '❤️';
    if (n.type === 'story_reaction') return n.emoji || '🔥';
    return '🔔';
  }

  function getText(n: Notification) {
    if (n.type === 'message') return `${n.senderName}: ${n.content}`;
    if (n.type === 'reaction') return `${n.senderName} reacted ${n.emoji} to your message`;
    if (n.type === 'story_reaction') return `${n.senderName} reacted ${n.emoji} to your story`;
    return '';
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggle}
        style={{
          width: 32, height: 32,
          borderRadius: 8,
          background: 'rgba(0,200,255,0.08)',
          border: '1px solid rgba(0,200,255,0.15)',
          color: 'rgba(0,200,255,0.6)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, position: 'relative',
        }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 16, height: 16,
            background: '#ef4444',
            borderRadius: '50%',
            fontSize: 9, fontWeight: 700,
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #060b14',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', top: 40, right: 0,
            width: 300,
            background: 'rgba(10,16,32,0.98)',
            border: '1px solid rgba(0,200,255,0.2)',
            borderRadius: 12,
            overflow: 'hidden',
            zIndex: 50,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(0,200,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ color: 'white', fontWeight: 600, fontSize: 13, margin: 0 }}>Notifications</p>
              {notifications.length > 0 && (
                <button
                  onClick={markNotificationsRead}
                  style={{ fontSize: 11, color: 'rgba(0,200,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 24, margin: '0 0 8px' }}>🔔</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid rgba(0,200,255,0.06)',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      background: n.read ? 'transparent' : 'rgba(0,200,255,0.04)',
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{getIcon(n)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '0 0 2px', lineHeight: 1.4 }}>
                        {getText(n)}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
                        {formatTime(n.timestamp)}
                      </p>
                    </div>
                    {!n.read && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c8ff', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}