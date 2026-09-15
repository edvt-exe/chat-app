import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { motion } from 'framer-motion';

interface Props { onClose: () => void; }

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
  const fileRef = useRef<HTMLInputElement>(null);
  const wallRef = useRef<HTMLInputElement>(null);

  async function saveProfile() {
    setSaving(true);
    try {
      const { data } = await api.patch('/api/users/me', { username, bio });
      if (token) login(data, token);
      alert('Saved');
    } catch (e: any) { alert('Error saving'); }
    finally { setSaving(false); }
  }

  async function savePassword() {
    setSaving(true);
    try {
      await api.patch('/api/users/me/password', { currentPassword: currentPwd, newPassword: newPwd });
      alert('Password changed'); setCurrentPwd(''); setNewPwd('');
    } catch (e: any) { alert('Error changing password'); }
    finally { setSaving(false); }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData(); formData.append('avatar', file);
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

  const TABS = [{ id: 'profile', label: 'Profile' }, { id: 'password', label: 'Security' }, { id: 'appearance', label: 'Appearance' }] as const;

  const inputClass = "w-full bg-ios-input text-white rounded-xl px-3 py-2.5 text-[15px] outline-none placeholder-ios-text-sec";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-ios-card rounded-[24px] overflow-hidden shadow-2xl border border-ios-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ios-border">
          <h2 className="font-semibold text-[17px] text-white">Settings</h2>
          <button onClick={onClose} className="text-ios-blue text-[15px] font-medium">Done</button>
        </div>

        <div className="p-5">
          <div className="flex bg-ios-input p-[3px] rounded-[9px] w-full mb-6">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-1.5 px-1 text-[13px] font-medium rounded-md transition-all duration-200 ${tab === t.id ? 'bg-[#636366] text-white shadow-sm' : 'text-ios-text-muted hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'profile' && (
            <div className="space-y-4">
               <div className="flex flex-col items-center gap-2 mb-2">
                <div onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-full bg-ios-hover flex items-center justify-center text-[24px] font-bold text-white overflow-hidden cursor-pointer">
                  {user?.avatarUrl ? <img src={`${API}${user.avatarUrl}`} className="w-full h-full object-cover" alt="" /> : user?.username[0].toUpperCase()}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <button onClick={() => fileRef.current?.click()} className="text-[13px] text-ios-blue">Edit picture</button>
              </div>
              <input value={username} onChange={e => setUsername(e.target.value)} className={inputClass} placeholder="Username" />
              <textarea value={bio} onChange={e => setBio(e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Bio" />
              <button onClick={saveProfile} disabled={saving} className="w-full bg-ios-blue text-white py-3 rounded-xl font-semibold text-[15px]">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}

          {tab === 'password' && (
            <div className="space-y-4">
              <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className={inputClass} placeholder="Current Password" />
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className={inputClass} placeholder="New Password" />
              <button onClick={savePassword} disabled={saving || !currentPwd || !newPwd} className="w-full bg-ios-blue text-white py-3 rounded-xl font-semibold text-[15px]">{saving ? 'Changing...' : 'Change Password'}</button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-4">
              <div onClick={() => wallRef.current?.click()} className="w-full h-32 rounded-xl bg-ios-input flex items-center justify-center cursor-pointer border border-ios-border" style={{ background: wallpaper ? `url(${wallpaper}) center/cover` : '' }}>
                {!wallpaper && <p className="text-[13px] text-ios-text-sec">Choose Chat Wallpaper</p>}
              </div>
              <input ref={wallRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaperChange} />
              {wallpaper && <button onClick={() => { localStorage.removeItem('wallpaper'); setWallpaper(''); window.dispatchEvent(new Event('wallpaper-change')); }} className="text-[13px] text-ios-red w-full text-center">Remove wallpaper</button>}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}