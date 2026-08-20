import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', identifier: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data } = await api.post('/api/auth/register', {
          username: form.username,
          email: form.email,
          password: form.password,
        });
        login(data.user, data.token);
      } else {
        const { data } = await api.post('/api/auth/login', {
          identifier: form.identifier,
          password: form.password,
        });
        login(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-100px] left-[10%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-80px] right-[15%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,100,255,0.10) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Nexus<span className="text-cyan-DEFAULT">Chat</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(0,200,255,0.5)' }}>
            Real-time messaging, reimagined
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="flex mb-6 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-send-btn text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-send-btn text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(0,200,255,0.6)' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="yourname"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,200,255,0.15)',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(0,200,255,0.6)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,200,255,0.15)',
                    }}
                    required
                  />
                </div>
              </>
            )}

            {mode === 'login' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(0,200,255,0.6)' }}>
                  Username or Email
                </label>
                <input
                  type="text"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder="yourname or you@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,200,255,0.15)',
                  }}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(0,200,255,0.6)' }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,200,255,0.15)',
                }}
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs rounded-lg px-3 py-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-send-btn text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 hover:opacity-90"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}