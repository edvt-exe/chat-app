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
      <span className={`text-[12px] ${ok ? 'text-ios-green' : 'text-ios-text-sec'}`}>{ok ? '✓' : '○'}</span>
      <span className={`text-[11px] ${ok ? 'text-ios-green' : 'text-ios-text-sec'}`}>{label}</span>
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
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStrength, setShowStrength] = useState(false);

  const strength = checkPassword(form.password);
  const passwordValid = Object.values(strength).every(Boolean);

  // Modificat: text-white în text-ios-text-main pentru Light Mode
  const inputClass = "w-full rounded-xl px-4 py-3 text-[17px] bg-ios-input text-ios-text-main placeholder-ios-text-sec outline-none transition-colors border border-ios-border/50 focus:border-ios-blue";
  const labelClass = "block text-[13px] font-medium mb-1.5 text-ios-text-muted";

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    if (mode === 'register') {
      if (!passwordValid) { setError('Password does not meet all requirements'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data } = await api.post('/api/auth/register', { username: form.username, email: form.email, password: form.password });
        setSuccessMsg('Cont creat cu succes! Se Redirecționează...');
        setTimeout(() => login(data.user, data.token), 1200);
      } else {
        const { data } = await api.post('/api/auth/login', { identifier: form.identifier, password: form.password });
        if (data.userId) { setPendingUserId(data.userId); setStep('verify'); } 
        else if (data.token) {
          setSuccessMsg('Autentificare reușită! Se Redirecționează...');
          setTimeout(() => login(data.user, data.token), 1200);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      const { data } = await api.post('/api/auth/verify-code', { userId: pendingUserId, code: code.trim() });
      setSuccessMsg('Autentificare reușită! Se Redirecționează...');
      setTimeout(() => login(data.user, data.token), 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ios-bg">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-ios-text-main tracking-tight mb-2">NexusChat</h1>
          <p className="text-[15px] text-ios-text-sec">Sign in to continue</p>
        </div>

        <div className="bg-ios-card rounded-[24px] p-6 shadow-2xl border border-ios-border">
          {step === 'verify' ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-[17px] text-ios-text-main font-semibold tracking-tight">Check your email</p>
                <p className="text-[13px] mt-1 text-ios-text-sec">We sent a 6-digit code</p>
              </div>
              <div>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`} maxLength={6} required autoFocus />
              </div>
              {error && <p className="text-[13px] text-ios-red text-center">{error}</p>}
              {successMsg && <p className="text-[13px] text-ios-green font-medium text-center">{successMsg}</p>}
              <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-ios-blue text-white text-[17px] font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-2">
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setCode(''); setError(''); setSuccessMsg(''); }} className="w-full text-[15px] text-ios-blue mt-4">Back to login</button>
            </form>
          ) : (
            <>
              <div className="flex bg-ios-input p-[3px] rounded-[9px] w-full mb-6">
                {(['login', 'register'] as const).map((m) => (
                  <button key={m} onClick={() => { setMode(m); setError(''); setSuccessMsg(''); setShowStrength(false); }} className={`flex-1 py-1.5 px-1 text-[13px] font-medium rounded-md transition-all duration-200 ${mode === m ? 'bg-ios-card text-ios-text-main shadow-sm border border-ios-border/50' : 'text-ios-text-muted hover:text-ios-text-main'}`}>
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCredentials} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className={labelClass}>Username</label>
                      <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="yourname" className={inputClass} required minLength={3} />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className={inputClass} required />
                    </div>
                  </>
                )}
                {mode === 'login' && (
                  <div>
                    <label className={labelClass}>Username or Email</label>
                    <input type="text" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="Username or Email" className={inputClass} required />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onFocus={() => mode === 'register' && setShowStrength(true)} placeholder="••••••••" className={inputClass} required />
                  {mode === 'register' && showStrength && (
                    <div className="mt-3 p-3 rounded-xl bg-ios-bg space-y-1.5 border border-ios-border">
                      <StrengthRow ok={strength.hasLength} label="At least 8 characters" />
                      <StrengthRow ok={strength.hasUpper} label="One uppercase letter (A-Z)" />
                      <StrengthRow ok={strength.hasLower} label="One lowercase letter (a-z)" />
                      <StrengthRow ok={strength.hasNumber} label="One number (0-9)" />
                      <StrengthRow ok={strength.hasSpecial} label="One special character (!@#$...)" />
                    </div>
                  )}
                </div>
                {error && <p className="text-[13px] text-ios-red text-center pt-2">{error}</p>}
                {successMsg && <p className="text-[13px] text-ios-green font-medium text-center pt-2">{successMsg}</p>}
                <button type="submit" disabled={loading || (mode === 'register' && !passwordValid)} className="w-full mt-2 bg-ios-blue text-white text-[17px] font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50">
                  {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}