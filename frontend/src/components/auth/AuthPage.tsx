import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface PasswordStrength {
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasLength: boolean;
}

function checkPassword(pwd: string): PasswordStrength {
  return {
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    hasLength: pwd.length >= 8,
  };
}

function StrengthRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: ok ? '#22d46a' : 'rgba(255,255,255,0.25)', fontSize: 12 }}>
        {ok ? '✓' : '○'}
      </span>
      <span style={{ fontSize: 11, color: ok ? 'rgba(34,212,106,0.8)' : 'rgba(255,255,255,0.3)' }}>
        {label}
      </span>
    </div>
  );
}

type Step = 'credentials' | 'verify';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<Step>('credentials');
  const [pendingUserId, setPendingUserId] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', identifier: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStrength, setShowStrength] = useState(false);

  const strength = checkPassword(form.password);
  const passwordValid = Object.values(strength).every(Boolean);

  const inputStyle = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(0,200,255,0.15)',
  };

  const inputClass = "w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors";

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    marginBottom: 6,
    color: 'rgba(0,200,255,0.6)',
  };

  async function handleCredentials(e: React.FormEvent) {
  e.preventDefault();
  setError('');

  if (mode === 'register') {
    if (!passwordValid) { setError('Password does not meet all requirements'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { setError('Please enter a valid email address'); return; }
  }

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

      if (data.userId) {
        setPendingUserId(data.userId);
        setStep('verify');
      } else if (data.token) {
        login(data.user, data.token);
      }
    }
  } catch (err: any) {
    setError(err.response?.data?.error || 'Something went wrong');
  } finally {
    setLoading(false);
  }
}

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/verify-code', {
        userId: pendingUserId,
        code: code.trim(),
      });
      login(data.user, data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#060b14' }}
    >
      <div className="absolute top-[-100px] left-[10%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-80px] right-[15%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,100,255,0.10) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Nexus<span style={{ color: '#00c8ff' }}>Chat</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(0,200,255,0.5)' }}>
            Real-time messaging, reimagined
          </p>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,200,255,0.12)' }}>

          {step === 'verify' ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📧</div>
                <p className="text-white font-semibold">Check your email</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  We sent a 6-digit code to your email address
                </p>
              </div>

              <div>
                <label style={labelStyle}>Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    textAlign: 'center',
                    fontSize: 24,
                    letterSpacing: 8,
                    fontWeight: 700,
                  }}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #0096ff, #00c8ff)' }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setCode(''); setError(''); }}
                className="w-full text-sm py-2"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                ← Back to login
              </button>
            </form>
          ) : (
            <>
              <div className="flex mb-6 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(''); setShowStrength(false); }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: mode === m ? 'linear-gradient(135deg, #0096ff, #00c8ff)' : 'transparent',
                      color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCredentials} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label style={labelStyle}>Username</label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="yourname"
                        className={inputClass}
                        style={inputStyle}
                        required
                        minLength={3}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className={inputClass}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </>
                )}

                {mode === 'login' && (
                  <div>
                    <label style={labelStyle}>Username or Email</label>
                    <input
                      type="text"
                      value={form.identifier}
                      onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                      placeholder="yourname or you@example.com"
                      className={inputClass}
                      style={inputStyle}
                      required
                    />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={() => mode === 'register' && setShowStrength(true)}
                    placeholder="••••••••"
                    className={inputClass}
                    style={inputStyle}
                    required
                  />
                  {mode === 'register' && showStrength && (
                    <div className="mt-2 p-3 rounded-xl space-y-1"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,200,255,0.1)' }}>
                      <StrengthRow ok={strength.hasLength} label="At least 8 characters" />
                      <StrengthRow ok={strength.hasUpper} label="One uppercase letter (A-Z)" />
                      <StrengthRow ok={strength.hasLower} label="One lowercase letter (a-z)" />
                      <StrengthRow ok={strength.hasNumber} label="One number (0-9)" />
                      <StrengthRow ok={strength.hasSpecial} label="One special character (!@#$...)" />
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-xs rounded-lg px-3 py-2"
                    style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || (mode === 'register' && !passwordValid)}
                  className="w-full text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0096ff, #00c8ff)' }}
                >
                  {loading
                    ? 'Loading...'
                    : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}