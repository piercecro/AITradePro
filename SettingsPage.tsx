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
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-white text-3xl font-bold mb-8">Settings</h1>

        <div className="bg-[#13151f] rounded-xl p-8 border border-gray-800">
          <h2 className="text-white text-xl font-semibold mb-6 flex items-center space-x-2">
            <User size={24} />
            <span>Profile Settings</span>
          </h2>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error')
                ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                : 'bg-green-500/10 border border-green-500/20 text-green-500'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="text-gray-400 text-sm mb-2 block flex items-center space-x-2">
                <User size={16} />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block flex items-center space-x-2">
                <Mail size={16} />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-[#1a1d29] text-gray-500 rounded-lg px-4 py-3 border border-gray-700 cursor-not-allowed"
              />
              <p className="text-gray-500 text-xs mt-2">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>

        <div className="bg-[#13151f] rounded-xl p-8 border border-gray-800 mt-6">
          <h2 className="text-white text-xl font-semibold mb-6 flex items-center space-x-2">
            <Lock size={24} />
            <span>Security</span>
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-[#1a1d29] rounded-lg">
              <div className="text-white font-semibold mb-2">Two-Factor Authentication</div>
              <div className="text-gray-400 text-sm mb-3">
                Add an extra layer of security to your account
              </div>
              <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Enable 2FA
              </button>
            </div>

            <div className="p-4 bg-[#1a1d29] rounded-lg">
              <div className="text-white font-semibold mb-2">Change Password</div>
              <div className="text-gray-400 text-sm mb-3">
                Update your password regularly to keep your account secure
              </div>
              <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
