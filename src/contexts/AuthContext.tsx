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

  // Try to create profile, with a small retry on FK/transient errors
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

        // If duplicate key, profile already exists — nothing to do
        if (insertErr.message && insertErr.message.toLowerCase().includes('duplicate')) {
          return;
        }

        // If foreign key or transient error, retry after a short delay
        const isTransient =
          insertErr.message &&
          (insertErr.message.toLowerCase().includes('foreign key') ||
            insertErr.message.toLowerCase().includes('could not serialize') ||
            insertErr.message.toLowerCase().includes('timeout'));

        if (!isTransient) {
          console.error('Error creating user profile:', insertErr.message);
          return;
        }

        // transient -> wait and retry
        const delayMs = 200 * (attempt + 1);
        await new Promise((r) => setTimeout(r, delayMs));
      } catch (err) {
        console.error('Unexpected error creating profile:', err);
        return;
      }
    }

    console.warn('Exceeded retries creating user profile for', u.id);
  };

  // Ensure profile exists, but first check to avoid duplicate inserts
  const ensureProfileExists = async (u: User | null) => {
    if (!u) return;
    try {
      const { data: existing, error: fetchErr, status } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', u.id)
        .single();

      if (fetchErr && status !== 406) {
        // Not-found single() returns 406; any other error we log and attempt creation
        console.warn('Error checking profile existence:', fetchErr.message);
      }

      if (!existing) {
        // Run creation in background with retry logic
        createProfileWithRetry(u).catch((e) => console.error(e));
      }
    } catch (err) {
      console.error('Unexpected error in ensureProfileExists:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Handle email confirmation redirects (the /auth/callback page)
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
            // Background ensure profile
            ensureProfileExists(confirmedUser);
          }

          // Clean up URL after processing
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Redirect handler error:', err);
        if (mounted) setLoading(false);
      }
    };

    handleRedirect();

    // Load initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        // Ensure profile in background
        ensureProfileExists(currentUser);
      })
      .catch((err) => {
        console.error('getSession error:', err);
        if (mounted) setLoading(false);
      });

    // Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      setLoading(false);
      // Do not await — create profile in background to avoid blocking UI
      ensureProfileExists(newUser).catch((e) => console.error(e));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      // Avoid leaving the app stuck in loading in case onAuthStateChange doesn't fire immediately
      setLoading(false);
    }
  };

  // Sign up new user — do not create profile here; it will be created after session is established
  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
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
      // profile creation will happen via ensureProfileExists after session is confirmed
    } finally {
      setLoading(false);
    }
  };

  // Sign out
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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
