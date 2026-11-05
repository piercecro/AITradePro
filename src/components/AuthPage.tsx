import { useEffect, useState } from 'react';
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
  const [unavailableNotice, setUnavailableNotice] = useState('');
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

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!unavailableNotice) return;
    const timer = setTimeout(() => setUnavailableNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [unavailableNotice]);

  const showUnavailableMessage = () => {
    setUnavailableNotice('Not available right now, try again.');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-24 sm:py-28">
      <div className="absolute left-6 top-6 z-10 flex items-center space-x-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">A</div>
        <span className="text-xl font-semibold tracking-tight text-slate-900">AITradePro</span>
      </div>

      <button type="button" className="absolute right-6 top-6 z-10 flex items-center space-x-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
        <Globe size={18} />
        <span className="text-sm font-medium">EN</span>
        <ChevronDown size={14} />
      </button>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <section className="order-2 mx-auto w-full max-w-md lg:order-1 lg:ml-0">
          <header className="mb-6 text-center lg:text-left">
            <h1 className="bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400 bg-clip-text text-3xl font-extrabold leading-tight tracking-tight text-transparent sm:text-4xl">
              Where the world markets is automated
            </h1>
            <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-600">
              Join <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text font-extrabold text-transparent">100 million</span> traders and investors taking the future into their own hands.
            </p>
          </header>

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">{isLogin ? 'Hello again' : 'Create account'}</h2>

            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
            {unavailableNotice && <div role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{unavailableNotice}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="mb-2 block text-sm text-slate-600">Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="Choose a username" required />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-slate-600">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="you@example.com" required />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-slate-600">Password</label>
                  {isLogin && <button type="button" onClick={() => setUnavailableNotice('Password reset is not available right now, try again.')} className="text-sm text-sky-600 hover:underline">Forgot password?</button>}
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="Enter your password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 py-3 font-semibold text-white transition-all hover:from-sky-700 hover:to-cyan-600 disabled:opacity-50">
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-slate-500">{isLogin ? "Don't have an account?" : 'Already have an account?'} </span>
              <button onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }} className="font-medium text-sky-600 hover:underline">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            <div className="my-6 text-center text-sm text-slate-400">Or continue with</div>
            <div className="mb-6 flex justify-center space-x-4">
              <button type="button" onClick={showUnavailableMessage} aria-label="Continue with Google" className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100">
                <GoogleIcon />
              </button>
              <button type="button" onClick={showUnavailableMessage} aria-label="Continue with Apple" className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-900 transition-colors hover:bg-slate-100">
                <AppleIcon />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <StoreButton platform="App Store" onClick={showUnavailableMessage} icon={<AppleIcon />} />
              <StoreButton platform="Google Play" onClick={showUnavailableMessage} icon={<PlayIcon />} />
            </div>
          </div>

          {isLogin && (
            <div className="mt-6 text-center text-xs leading-relaxed text-slate-500">
              AITradePro is operated by White Mint Financial Company s.r.o., a registered company in the Czech Republic (registration number 17260884). White Mint Financial Company s.r.o. is regulated by the Czech National Bank.
            </div>
          )}
        </section>

        <div className="order-1 hidden h-[min(78vh,52rem)] min-h-[34rem] overflow-hidden rounded-3xl shadow-[0_24px_70px_rgba(15,23,42,0.18)] lg:order-2 lg:block">
          <img src="/images/signup-sunrise.svg" alt="Sunrise over green mountain hills with the message: Start your autotrading journey" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
};

const Globe = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ChevronDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.47 1.72-3.05 1.83-2.33 6.1.47 7.22-.56 1.48-1.28 2.94-2.59 4.07zM12.03 7.18c-.15-2.2 1.64-4.02 3.7-4.18.29 2.53-2.3 4.42-3.7 4.18z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3.3 2.7a2 2 0 0 0-.3 1v16.6a2 2 0 0 0 .3 1L12 12 3.3 2.7zM14 10l5.5-3.2L5.1 1.9 14 10zm0 4-8.9 8.1 14.4-4.9L14 14zm7.5-6.1L15.5 12l6 4.1a2 2 0 0 0 0-8.2z" />
  </svg>
);

const StoreButton = ({ platform, onClick, icon }: { platform: string; onClick: () => void; icon: React.ReactNode }) => (
  <button type="button" onClick={onClick} className="flex items-center space-x-2 rounded-lg bg-slate-900 px-4 py-2 text-left text-white transition-colors hover:bg-slate-800">
    {icon}
    <span>
      <span className="block text-[10px] opacity-80">Coming soon</span>
      <span className="block text-sm font-semibold">{platform}</span>
    </span>
  </button>
);
