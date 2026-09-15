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
      } finally { setLoading(false); }
    }, 300);
  }, [query]);

  async function handleSelect(userId: string) {
    await startConversation(userId);
    setQuery(''); setResults([]); setOpen(false);
  }

  return (
    <div className="relative px-3 py-3 shrink-0 border-b border-ios-border">
      <div className="flex items-center gap-2 bg-ios-input px-3 py-1.5 rounded-[10px]" onClick={() => setOpen(true)}>
        <span className="text-ios-text-sec text-[14px]">🔍</span>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Search..."
          className="flex-1 bg-transparent text-white placeholder-ios-text-sec outline-none text-[15px]"
        />
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute left-3 right-3 top-full mt-2 rounded-[16px] bg-ios-card border border-ios-border z-50 overflow-hidden shadow-2xl">
          {loading && <div className="px-4 py-3 text-[13px] text-ios-text-sec">Searching...</div>}
          {!loading && results.length === 0 && <div className="px-4 py-3 text-[13px] text-ios-text-sec">No users found</div>}
          {results.map((u) => (
            <button
              key={u.id} onClick={() => handleSelect(u.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-ios-border last:border-none hover:bg-ios-hover transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-ios-blue text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
                {u.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[15px] font-medium text-white">{u.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}