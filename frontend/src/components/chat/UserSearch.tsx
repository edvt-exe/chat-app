import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useChat } from '../../contexts/ChatContext';

interface UserResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { startConversation } = useChat();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/users/search?q=${query}`);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  async function handleSelect(userId: string) {
    await startConversation(userId);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative px-3 py-3 flex-shrink-0">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-text"
        style={{
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(0,200,255,0.1)',
        }}
        onClick={() => setOpen(true)}
      >
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>🔍</span>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Search users..."
          className="flex-1 bg-transparent text-white placeholder-white/20 focus:outline-none text-sm"
        />
      </div>

      {open && (query.length >= 2) && (
        <div
          className="absolute left-3 right-3 top-full mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(10,16,32,0.98)',
            border: '1px solid rgba(0,200,255,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {loading && (
            <div className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No users found
            </div>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelect(u.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
              style={{ borderBottom: '1px solid rgba(0,200,255,0.06)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,200,255,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 relative"
                style={{ background: 'linear-gradient(135deg, #0066ff, #00c8ff)', color: 'white' }}
              >
                {u.username[0].toUpperCase()}
                {u.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 border-2"
                    style={{ borderColor: '#0a1020' }} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{u.username}</p>
                <p className="text-xs" style={{ color: u.isOnline ? '#22d46a' : 'rgba(255,255,255,0.3)' }}>
                  {u.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}