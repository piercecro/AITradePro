import { useState, useEffect } from 'react';
import { User, Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user?.id)
      .maybeSingle();

    if (data) {
      setUsername(data.username || '');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ username })
        .eq('id', user?.id);

      if (error) throw error;

      setMessage('Profile updated successfully');
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf3f8] px-6 py-8 text-slate-800">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-slate-800">Settings</h1>

        <div className="rounded-xl border border-[#dfe7f0] bg-white p-8 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <h2 className="mb-6 flex items-center space-x-2 text-xl font-semibold text-slate-800">
            <User size={24} />
            <span>Profile Settings</span>
          </h2>

          {message && (
            <div className={`mb-6 rounded-lg p-4 ${
              message.includes('Error')
                ? 'border border-red-200 bg-red-50 text-red-600'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="mb-2 flex items-center space-x-2 text-sm text-slate-600">
                <User size={16} />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-[#dfe7f0] bg-white px-4 py-3 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#a7c4ff]"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center space-x-2 text-sm text-slate-600">
                <Mail size={16} />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-[#dfe7f0] bg-[#f3f6fb] px-4 py-3 text-slate-500"
              />
              <p className="mt-2 text-xs text-slate-500">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#1d4ed8] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#1e3fb8] md:w-auto"
            >
              Save Changes
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-[#dfe7f0] bg-white p-8 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <h2 className="mb-6 flex items-center space-x-2 text-xl font-semibold text-slate-800">
            <Lock size={24} />
            <span>Security</span>
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-[#f4f7fb] p-4">
              <div className="mb-2 font-semibold text-slate-800">Two-Factor Authentication</div>
              <div className="mb-3 text-sm text-slate-500">
                Add an extra layer of security to your account
              </div>
              <button className="rounded-lg bg-slate-200 px-6 py-2 text-slate-700 transition-colors hover:bg-slate-300">
                Enable 2FA
              </button>
            </div>

            <div className="rounded-lg bg-[#f4f7fb] p-4">
              <div className="mb-2 font-semibold text-slate-800">Change Password</div>
              <div className="mb-3 text-sm text-slate-500">
                Update your password regularly to keep your account secure
              </div>
              <button className="rounded-lg bg-slate-200 px-6 py-2 text-slate-700 transition-colors hover:bg-slate-300">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
