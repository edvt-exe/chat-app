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
    <div className="relative">
      <button
        onClick={toggle}
        className="relative w-8 h-8 rounded-full bg-ios-input text-ios-text-sec hover:text-white flex items-center justify-center transition-colors"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-ios-red rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-ios-bg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 sm:right-0 sm:left-auto w-[300px] bg-ios-card border border-ios-border rounded-2xl overflow-hidden z-50 shadow-2xl">
            
            <div className="px-4 py-3 border-b border-ios-border flex justify-between items-center">
              <p className="text-white font-semibold text-[15px]">Notifications</p>
              {notifications.length > 0 && (
                <button
                  onClick={markNotificationsRead}
                  className="text-[13px] text-ios-blue font-medium"
                >
                  Mark read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-[13px] text-ios-text-sec">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-ios-border last:border-0 ${
                      n.read ? 'bg-transparent' : 'bg-ios-input/50'
                    }`}
                  >
                    <span className="text-[18px] shrink-0">{getIcon(n)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-white leading-snug mb-0.5 break-words">
                        {getText(n)}
                      </p>
                      <p className="text-[11px] text-ios-text-sec">
                        {formatTime(n.timestamp)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-ios-blue shrink-0 mt-1.5" />
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