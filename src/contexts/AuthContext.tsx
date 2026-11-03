import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const createProfileWithRetry = async (u: User | null, maxRetries = 2) => {
    if (!u) return;
    const metadata = u.user_metadata as Record<string, unknown> | undefined;
    const metaUsername = metadata?.username ?? metadata?.full_name ?? u.email?.split('@')[0] ?? 'User';
    const referralId = isUuid(metadata?.referred_by) && metadata?.referred_by !== u.id ? metadata.referred_by : null;
    const email = u.email ?? '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { error: insertErr } = await supabase.from('user_profiles').upsert(
          { id: u.id, username: metaUsername, email, role: 'user', referred_by: referralId },
          { onConflict: 'id', ignoreDuplicates: true }
        );
        if (!insertErr) return;

        const lowerMessage = insertErr.message?.toLowerCase() ?? '';
        if (lowerMessage.includes('duplicate')) return;
        const isMissingColumn = lowerMessage.includes('column') && lowerMessage.includes('does not exist');
        const isMissingTable = lowerMessage.includes('relation') && lowerMessage.includes('does not exist');
        if (isMissingColumn || isMissingTable) {
          console.error('Supabase user_profiles schema is missing required columns or table. Run the required migration before using account features.');
          console.error('Profile creation error:', insertErr.message);
          return;
        }
        const isTransient = lowerMessage.includes('foreign key') || lowerMessage.includes('could not serialize') || lowerMessage.includes('timeout');
        if (!isTransient) {
          console.error('Error creating user profile:', insertErr.message);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      } catch (err) {
        console.error('Unexpected error creating profile:', err);
        return;
      }
    }
    console.warn('Exceeded retries creating profile for', u.id);
  };

  const ensureProfileExists = async (u: User | null) => {
    if (!u) return;
    try {
      const { data: existing, error: fetchErr, status } = await supabase
        .from('user_profiles').select('id').eq('id', u.id).single();
      if (fetchErr && status !== 406) console.warn('Error checking profile existence:', fetchErr.message);
      if (!existing) createProfileWithRetry(u).catch((err) => console.error('ensureProfileExists failed:', err));
    } catch (err) {
      console.error('Unexpected error in ensureProfileExists:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const handleRedirect = async () => {
      try {
        if (window.location.hash.includes('access_token')) {
          const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) console.error('Error handling redirect:', error.message);
          else {
            const confirmedUser = data.session?.user ?? null;
            if (!mounted) return;
            setUser(confirmedUser);
            setLoading(false);
            ensureProfileExists(confirmedUser);
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Redirect handler error:', err);
        if (mounted) setLoading(false);
      }
    };
    void handleRedirect();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      ensureProfileExists(currentUser);
    }).catch((err) => {
      console.error('getSession error:', err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      setLoading(false);
      ensureProfileExists(newUser).catch((err) => console.error(err));
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage('❌ Incorrect email or password. Please try again.');
        setShowError(true);
        setTimeout(() => { setShowError(false); setTimeout(() => setErrorMessage(null), 500); }, 5000);
        throw error;
      }
    } finally { setLoading(false); }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setSuccessMessage(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const params = new URLSearchParams(window.location.search);
      const referralId = params.get('ref');
      const metadata: Record<string, string> = { username };
      if (isUuid(referralId)) metadata.referred_by = referralId;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata, emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      setSuccessMessage('✅ Signup successful! Please check your email to confirm your account.');
      setShowMessage(true);
      setTimeout(() => { setShowMessage(false); setTimeout(() => setSuccessMessage(null), 500); }, 5000);
    } catch (err: any) {
      console.error('Signup error:', err.message);
      throw err;
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl, queryParams: { access_type: 'offline', prompt: 'consent' } },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(`OAuth sign in failed for ${provider}:`, err);
      setErrorMessage(err?.message || `Unable to sign in with ${provider}.`);
      setShowError(true);
      setTimeout(() => { setShowError(false); setTimeout(() => setErrorMessage(null), 500); }, 5000);
    } finally { setLoading(false); }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } finally { setLoading(false); }
  };

  return (
    <>
      {successMessage && <div className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl bg-green-500 px-6 py-4 text-white shadow-lg transition-all duration-500 ${showMessage ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}><p className="mb-3 text-sm font-medium">{successMessage}</p><button onClick={() => { setShowMessage(false); setTimeout(() => setSuccessMessage(null), 500); }} className="rounded-md bg-white/20 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/30">OK</button></div>}
      {errorMessage && <div className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl bg-red-600 px-6 py-4 text-white shadow-lg transition-all duration-500 ${showError ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}><p className="mb-3 text-sm font-medium">{errorMessage}</p><button onClick={() => { setShowError(false); setTimeout(() => setErrorMessage(null), 500); }} className="rounded-md bg-white/20 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/30">OK</button></div>}
      <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithOAuth, signOut }}>{children}</AuthContext.Provider>
    </>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
