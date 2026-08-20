import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface Props {
  onClose: () => void;
}

const API = 'http://localhost:3000';

export default function SettingsPanel({ onClose }: Props) {
  const { user, login, token } = useAuth();
  const [tab, setTab] = useState<'profile' | 'password' | 'appearance'>('profile');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [wallpaper, setWallpaper] = useState(localStorage.getItem('wallpaper') || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const wallRef = useRef<HTMLInputElement>(null);

  async function saveProfile() {
    setSaving(true);
    setMsg(''); setError('');
    try {
      const { data } = await api.patch('/api/users/me', { username, bio });
      if (token) login(data, token);
      setMsg('Profile updated');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (newPwd.length < 8) { setError('New password too short'); return; }
    setSaving(true); setMsg(''); setError('');
    try {
      await api.patch('/api/users/me/password', { currentPassword: currentPwd, newPassword: newPwd });
      setMsg('Password changed'); setCurrentPwd(''); setNewPwd('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/api/users/me/avatar', formData);
    if (token) login({ ...user!, ...data }, token);
  }

  function handleWallpaperChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      localStorage.setItem('wallpaper', url);
      setWallpaper(url);
      window.dispatchEvent(new Event('wallpaper-change'));
    };
    reader.readAsDataURL(file);
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(0,200,255,0.15)',
    borderRadius: 12,
    padding: '10px 14px',
    color: 'white',
    fontSize: 14,
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    marginBottom: 6,
    color: 'rgba(0,200,255,0.6)',
  };

  const TABS = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Security' },
    { id: 'appearance', label: 'Appearance' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0a1020', border: '1px solid rgba(0,200,255,0.15)' }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(0,200,255,0.08)' }}>
          <h2 className="font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="flex gap-1 px-4 pt-3"
          style={{ borderBottom: '1px solid rgba(0,200,255,0.08)' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setMsg(''); setError(''); }}
              className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
              style={{
                color: tab === t.id ? '#00c8ff' : 'rgba(255,255,255,0.35)',
                borderBottom: tab === t.id ? '2px solid #00c8ff' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === 'profile' && (
            <>
              <div className="flex flex-col items-center gap-3 mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold cursor-pointer relative overflow-hidden group"
                  style={{ background: 'linear-gradient(135deg, #0066ff, #00c8ff)', color: 'white' }}
                  onClick={() => fileRef.current?.click()}
                >
                  {user?.avatarUrl ? (
                    <img src={`${API}${user.avatarUrl}`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    user?.username[0].toUpperCase()
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.5)', fontSize: 12 }}>
                    Change
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to change avatar</p>
              </div>

              <div>
                <label style={labelStyle}>Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people a bit about yourself..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <div className="pt-1 rounded-xl p-3" style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.08)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Email</p>
                <p className="text-sm text-white mt-0.5">{user?.email}</p>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #0096ff, #00c8ff)' }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </>
          )}

          {tab === 'password' && (
            <>
              <div>
                <label style={labelStyle}>Current Password</label>
                <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} style={inputStyle} placeholder="••••••••" />
              </div>
              <div>
                <label style={labelStyle}>New Password</label>
                <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} style={inputStyle} placeholder="••••••••" />
              </div>
              <button
                onClick={savePassword}
                disabled={saving || !currentPwd || !newPwd}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #0096ff, #00c8ff)' }}
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </>
          )}

          {tab === 'appearance' && (
            <>
              <div>
                <label style={labelStyle}>Chat Wallpaper</label>
                <div
                  className="w-full h-32 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    background: wallpaper ? `url(${wallpaper}) center/cover` : 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(0,200,255,0.15)',
                  }}
                  onClick={() => wallRef.current?.click()}
                >
                  {!wallpaper && (
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to choose wallpaper</p>
                  )}
                </div>
                <input ref={wallRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaperChange} />
                {wallpaper && (
                  <button
                    onClick={() => { localStorage.removeItem('wallpaper'); setWallpaper(''); window.dispatchEvent(new Event('wallpaper-change')); }}
                    className="mt-2 text-xs"
                    style={{ color: 'rgba(255,80,80,0.7)' }}
                  >
                    Remove wallpaper
                  </button>
                )}
              </div>
            </>
          )}

          {msg && <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#22d46a', background: 'rgba(34,212,106,0.1)', border: '1px solid rgba(34,212,106,0.2)' }}>{msg}</p>}
          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}