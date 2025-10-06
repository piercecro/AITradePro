import { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] via-[#1a2332] to-[#0f1a2e] flex items-center justify-center p-4">
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">A</span>
        </div>
        <span className="text-white text-xl font-semibold">AITradePro</span>
      </div>

      <button className="absolute top-6 right-6 flex items-center space-x-2 text-white">
        <Globe size={20} />
        <span>EN</span>
        <ChevronDown size={16} />
      </button>

      <div className="w-full max-w-md">
        <div className="bg-[#13151f] rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <h1 className="text-white text-2xl font-bold mb-6">
            {isLogin ? 'Hello again' : 'Create account'}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none transition-colors"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-400 text-sm">Password</label>
                {isLogin && (
                  <button type="button" className="text-blue-500 text-sm hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none transition-colors pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg py-3 font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-500 hover:underline font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          {isLogin && (
            <>
              <div className="my-6 text-center text-gray-400">Or Continue With</div>

              <div className="flex justify-center space-x-4 mb-6">
                <button className="w-12 h-12 bg-[#1a1d29] rounded-full flex items-center justify-center hover:bg-[#1f2230] transition-colors">
                  <GoogleIcon />
                </button>
                <button className="w-12 h-12 bg-[#1a1d29] rounded-full flex items-center justify-center hover:bg-[#1f2230] transition-colors">
                  <AppleIcon />
                </button>
              </div>

              <div className="flex justify-center space-x-4">
                <AppStoreButton />
                <GooglePlayButton />
              </div>
            </>
          )}
        </div>

        {isLogin && (
          <div className="mt-6 text-center text-gray-500 text-xs leading-relaxed">
            AITradePro is operated by White Mint Financial Company s.r.o., a registered company in the Czech
            Republic (registration number 17260884). White Mint Financial Company s.r.o. is regulated by FAU in the
            Czech Republic and holds an active license to engage in the intermediation of trading services, the
            provision of services associated with virtual assets and the manufacturing trading services. © 2025
            AITradePro
          </div>
        )}
      </div>
    </div>
  );
};

const Globe = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ChevronDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const AppStoreButton = () => (
  <a
    href="#"
    className="bg-black text-white rounded-lg px-4 py-2 flex items-center space-x-2 hover:bg-gray-900 transition-colors"
  >
    <AppleIcon />
    <div className="text-left">
      <div className="text-[10px] opacity-80">Download on the</div>
      <div className="text-sm font-semibold">App Store</div>
    </div>
  </a>
);

const GooglePlayButton = () => (
  <a
    href="#"
    className="bg-black text-white rounded-lg px-4 py-2 flex items-center space-x-2 hover:bg-gray-900 transition-colors"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.67l2.96 1.69c.4.23.65.66.65 1.13 0 .47-.25.9-.65 1.13l-2.96 1.69-3.44-3.44 3.44-2.2zm-9.75-9.75L13.69 12l-6.63 6.92L3.06 5.08zm10.88 6.17L13.69 12l3.25 3.25 2.96-1.69c.4-.23.65-.66.65-1.13 0-.47-.25-.9-.65-1.13l-2.96-1.69z" />
    </svg>
    <div className="text-left">
      <div className="text-[10px] opacity-80">GET IT ON</div>
      <div className="text-sm font-semibold">Google Play</div>
    </div>
  </a>
);
