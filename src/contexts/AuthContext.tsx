import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Success message states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  // ✅ Error message states (NEW)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // --- Original code unchanged ---
  const createProfileWithRetry = async (u: User | null, maxRetries = 2) => {
    if (!u) return;
    const usernameFromMeta = (u.user_metadata && (u.user_metadata as any).username) || '';
    const email = u.email ?? '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { error: insertErr } = await supabase.from('user_profiles').insert([
          {
            id: u.id,
            username: usernameFromMeta,
            email,
            available_balance: 0,
            total_deposited: 0,
            total_withdrawn: 0,
            total_profit: 0,
            role: 'user',
          },
        ]);

        if (!insertErr) {
          console.info('Created user profile for', u.id);
          return;
        }

        if (insertErr.message && insertErr.message.toLowerCase().includes('duplicate')) {
          return;
        }

        const isTransient =
          insertErr.message &&
          (insertErr.message.toLowerCase().includes('foreign key') ||
            insertErr.message.toLowerCase().includes('could not serialize') ||
            insertErr.message.toLowerCase().includes('timeout'));

        if (!isTransient) {
          console.error('Error creating user profile:', insertErr.message);
          return;
        }

        const delayMs = 200 * (attempt + 1);
        await new Promise((r) => setTimeout(r, delayMs));
      } catch (err) {
        console.error('Unexpected error creating profile:', err);
        return;
      }
    }

    console.warn('Exceeded retries creating user profile for', u.id);
  };

  const ensureProfileExists = async (u: User | null) => {
    if (!u) return;
    try {
      const { data: existing, error: fetchErr, status } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', u.id)
        .single();

      if (fetchErr && status !== 406) {
        console.warn('Error checking profile existence:', fetchErr.message);
      }

      if (!existing) {
        createProfileWithRetry(u).catch((e) => console.error(e));
      }
    } catch (err) {
      console.error('Unexpected error in ensureProfileExists:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleRedirect = async () => {
      try {
        const hashParams = window.location.hash;
        if (hashParams.includes('access_token')) {
          const { data, error } = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          });
          if (error) {
            console.error('Error handling redirect:', error.message);
          } else {
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

    handleRedirect();

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        ensureProfileExists(currentUser);
      })
      .catch((err) => {
        console.error('getSession error:', err);
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      setLoading(false);
      ensureProfileExists(newUser).catch((e) => console.error(e));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // ✅ Show error message if login fails
        setErrorMessage('❌ Incorrect email or password. Please try again.');
        setShowError(true);
        setTimeout(() => {
          setShowError(false);
          setTimeout(() => setErrorMessage(null), 500);
        }, 5000);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Updated signUp (spinner removed, success toast added)
  const signUp = async (email: string, password: string, username: string) => {
    setSuccessMessage(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // ✅ Show success message toast
      setSuccessMessage('✅ Signup successful! Please check your email to confirm your account.');
      setShowMessage(true);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowMessage(false);
        setTimeout(() => setSuccessMessage(null), 500);
      }, 5000);
    } catch (err: any) {
      console.error('Signup error:', err.message);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ Tailwind-style success toast (bottom-right) */}
      {successMessage && (
        <div
          className={`fixed bottom-6 right-6 bg-green-500 text-white shadow-lg rounded-xl px-6 py-4 max-w-sm transition-all duration-500 ease-in-out ${
            showMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ zIndex: 9999 }}
        >
          <p className="text-sm font-medium mb-3">{successMessage}</p>
          <button
            onClick={() => {
              setShowMessage(false);
              setTimeout(() => setSuccessMessage(null), 500);
            }}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-3 py-1.5 rounded-md transition"
          >
            OK
          </button>
        </div>
      )}

      {/* ❌ Tailwind-style error toast (bottom-right) */}
      {errorMessage && (
        <div
          className={`fixed bottom-6 right-6 bg-red-600 text-white shadow-lg rounded-xl px-6 py-4 max-w-sm transition-all duration-500 ease-in-out ${
            showError ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ zIndex: 9999 }}
        >
          <p className="text-sm font-medium mb-3">{errorMessage}</p>
          <button
            onClick={() => {
              setShowError(false);
              setTimeout(() => setErrorMessage(null), 500);
            }}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-3 py-1.5 rounded-md transition"
          >
            OK
          </button>
        </div>
      )}

      <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
        {children}
      </AuthContext.Provider>
    </>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
