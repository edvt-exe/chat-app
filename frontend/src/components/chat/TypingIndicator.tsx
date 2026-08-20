import { useState, useEffect } from 'react';
import { getSocket } from '../../services/socket';

interface Props {
  conversationId: string;
}

export default function TypingIndicator({ conversationId }: Props) {
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStart = ({ userId, username }: { userId: string; username: string }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: username }));
    };

    const handleStop = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on('typing:start', handleStart);
    socket.on('typing:stop', handleStop);

    return () => {
      socket.off('typing:start', handleStart);
      socket.off('typing:stop', handleStop);
    };
  }, [conversationId]);

  const names = Object.values(typingUsers);
  if (names.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-5 pb-2">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#00c8ff',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span className="text-xs" style={{ color: 'rgba(0,200,255,0.5)' }}>
        {names.join(', ')} {names.length === 1 ? 'is' : 'are'} typing...
      </span>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}