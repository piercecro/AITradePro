import { useState, useEffect } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
        setMessage('✅ Signup successful! Please check your email to verify your account.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-hide message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="absolute top-6 left-6 flex items-center space-x-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
          A
        </div>
        <span className="text-xl font-semibold tracking-tight text-slate-900">AITradePro</span>
      </div>

      <button className="absolute top-6 right-6 flex items-center space-x-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
        <Globe size={18} />
        <span className="text-sm font-medium">EN</span>
        <ChevronDown size={14} />
      </button>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h1 className="mb-6 text-2xl font-bold text-slate-900">
            {isLogin ? 'Hello again' : 'Create account'}
          </h1>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600 transition-opacity duration-500">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-2 block text-sm text-slate-600">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition-colors"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-slate-600">Password</label>
                {isLogin && (
                  <button type="button" className="text-sm text-sky-600 hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 py-3 font-semibold text-white transition-all hover:from-sky-700 hover:to-cyan-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-slate-500">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setMessage('');
              }}
              className="font-medium text-sky-600 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          {isLogin && (
            <>
              <div className="my-6 text-center text-sm text-slate-400">Or Continue With</div>

              <div className="mb-6 flex justify-center space-x-4">
                <button className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100">
                  <GoogleIcon />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100">
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
          <div className="mt-6 text-center text-xs leading-relaxed text-slate-500">
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.57 1.7-.25.2-.48.36-.72.54-.9.7-1.72 1.31-2.74 1.57-.76.19-1.43.14-2.14-.14-.55-.2-1.13-.31-1.72-.26-.65.06-1.3.3-1.9.64.8 1.26 1.82 2.06 3 2.4.83.24 1.68.28 2.5.1.63-.14 1.2-.43 1.72-.82.3-.23.59-.48.87-.75.42-.4.79-.86 1.1-1.34-.75-.31-1.37-.9-1.96-1.48-.54-.53-.95-1.16-1.2-1.84.76-.5 1.66-.69 2.56-.58 1.16.15 2.18.75 2.92 1.62.78.9 1.19 2.04 1.22 3.18-.07 1.14-.52 2.2-1.28 3.04-.93.99-2.06 1.55-3.33 1.69-.69.08-1.38-.02-2.03-.31-.69-.31-1.3-.79-1.77-1.43-.46-.63-.74-1.39-.74-2.16 0-.13 0-.26.02-.39.02.01.04.02.06.03.03.02.07.04.11.05.2.09.4.18.6.28.42.22.86.36 1.32.4.76.08 1.54-.08 2.2-.47.35-.2.64-.46.9-.77.46-.5.73-1.16.76-1.82-.09-.87-.53-1.7-1.27-2.33-.7-.59-1.62-.92-2.55-.9-.67.03-1.33.2-1.91.53-.3.17-.57.39-.82.62-.29.27-.59.54-.89.8-.26.2-.53.39-.8.56-.22.13-.44.25-.66.36-.54.25-1.14.39-1.73.34-.72-.06-1.42-.36-2.02-.82-.39-.3-.6-.68-.8-1.09.48-.42 1.01-.72 1.55-.96.7-.32 1.48-.48 2.25-.48 1.34 0 2.57.56 3.43 1.55.18.2.35.4.51.63.37.53.68 1.12.9 1.76.2.57.32 1.18.33 1.8.02.56-.06 1.12-.23 1.64-.26.76-.75 1.43-1.38 1.97-.92.79-2.1 1.26-3.35 1.27-.77.01-1.52-.18-2.18-.55-.97-.54-1.83-1.44-2.33-2.54-.27-.6-.43-1.27-.48-1.94-.06-.8.02-1.6.26-2.36.3-.94.84-1.79 1.58-2.43.48-.42 1.01-.74 1.62-.94.25-.08.51-.15.77-.18.42-.06.84-.04 1.25.08.6.2 1.18.64 1.58 1.14.22.29.38.63.47 1 .06.22.09.46.08.7-.02.52-.2 1.01-.52 1.44-.49.65-1.35 1.01-2.17 1.02-.42.01-.84-.1-1.2-.32-.59-.36-1.01-.96-1.18-1.62-.08-.33-.1-.68-.06-1.01.04-.41.18-.8.39-1.14.38-.62.94-1.1 1.6-1.35.5-.19 1.04-.23 1.56-.12.31.07.61.22.87.43.37.31.64.73.79 1.2.08.28.11.58.09.87-.02.53-.25 1.04-.65 1.42-.48.46-1.16.7-1.83.63-.5-.05-.96-.31-1.28-.72-.13-.17-.25-.37-.33-.58-.18-.46-.18-.98.06-1.42.12-.22.29-.42.49-.57.44-.35.98-.49 1.53-.42.88.12 1.64.78 1.88 1.66.12.44.15.91.06 1.35-.14.68-.59 1.28-1.18 1.6-.63.35-1.46.38-2.11.08-.77-.36-1.32-1.14-1.43-2-.08-.69.17-1.38.68-1.87.51-.49 1.23-.77 1.96-.75.72.01 1.42.33 1.92.87.4.43.66.99.75 1.58.08.61-.07 1.25-.44 1.76-.28.38-.66.67-1.09.83-.46.17-.96.17-1.41-.02-.64-.28-1.12-.87-1.28-1.58-.15-.65.05-1.34.53-1.81.4-.39.95-.61 1.5-.6.45.01.87.17 1.23.47.29.24.49.59.57.97.1.49-.03 1-.35 1.4-.2.25-.46.43-.76.53-.39.13-.81.12-1.18-.07-.44-.23-.76-.64-.89-1.11-.08-.28-.08-.57.02-.85.13-.36.4-.66.73-.85.37-.22.82-.29 1.24-.2.61.14 1.11.65 1.28 1.25.19.67-.01 1.43-.52 1.95-.54.54-1.38.82-2.16.72-.68-.09-1.32-.53-1.7-1.12-.23-.35-.37-.75-.42-1.18-.07-.7.02-1.43.32-2.04.31-.63.81-1.12 1.42-1.38.5-.21 1.05-.27 1.58-.17.64.12 1.24.49 1.69 1.02.37.43.62.98.7 1.56.11.93-.16 1.89-.73 2.62-.72.92-1.8 1.48-2.95 1.54-.95.05-1.9-.29-2.65-.93-.54-.46-.91-1.08-1.08-1.77-.28-.96-.18-1.98.26-2.88.43-.88 1.15-1.6 2.05-2.01.84-.38 1.84-.46 2.72-.23.9.25 1.71.83 2.28 1.58.58.78.9 1.75.88 2.75-.01.92-.31 1.8-.86 2.5-.66.82-1.66 1.34-2.71 1.46-.83.1-1.66-.05-2.39-.46-.63-.35-1.17-.88-1.48-1.54-.29-.61-.42-1.29-.37-1.96.12-.92.65-1.77 1.45-2.3.66-.44 1.46-.65 2.26-.57.78.08 1.52.51 2.04 1.14.73.88 1.04 2.07.82 3.23-.25 1.36-1.23 2.51-2.48 3.08-1.17.53-2.54.52-3.71-.06-.56-.28-1.04-.7-1.37-1.19-.31-.45-.52-.96-.62-1.48-.25-1.3-.06-2.66.63-3.72.9-1.39 2.4-2.38 4.06-2.7.96-.19 1.96-.13 2.89.2.92.32 1.77.92 2.42 1.7.76.93 1.19 2.15 1.22 3.39.02.98-.22 1.96-.73 2.79-.53.87-1.33 1.58-2.28 2.04-.75.36-1.61.54-2.46.49-.93-.08-1.81-.43-2.57-1.03-.99-.77-1.68-1.92-1.73-3.2-.06-1.25.41-2.49 1.33-3.4.35-.35.76-.64 1.2-.87.32-.16.67-.28 1.02-.35C17.09 20.06 17.35 20.15 17.05 20.28z" />
  </svg>
);

const AppStoreButton = () => (
  <a href="#" className="flex items-center space-x-2 rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800">
    <AppleIcon />
    <div className="text-left">
      <div className="text-[10px] opacity-80">Download on the</div>
      <div className="text-sm font-semibold">App Store</div>
    </div>
  </a>
);

const GooglePlayButton = () => (
  <a href="#" className="flex items-center space-x-2 rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.67l2.96 1.69c.4.23.65.66.65 1.13 0 .47-.25.9-.65 1.13l-2.96 1.69-3.44-3.44 3.44-2.2zm-9.75-9.66L13.69 12l-6.63 6.83L3.06 18l4.42-8.33 3.54-3.34-6.68-1.81z" />
    </svg>
    <div className="text-left">
      <div className="text-[10px] opacity-80">GET IT ON</div>
      <div className="text-sm font-semibold">Google Play</div>
    </div>
  </a>
);
