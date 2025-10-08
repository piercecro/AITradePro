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

  // Helper: ensure the user_profiles row exists for a confirmed session.user
  const ensureProfileExists = async (u: User | null) => {
    if (!u) return;

    try {
      // Check if profile already exists
      const { data: existing, error: fetchErr } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', u.id)
        .single();

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        // PGRST116 is PostgREST "Result contains no rows" (single() when not found)
        console.warn('Error checking profile existence:', fetchErr.message);
      }

      if (!existing) {
        // Compose profile from available user fields
        const usernameFromMeta = (u.user_metadata && (u.user_metadata as any).username) || '';
        const email = u.email ?? '';

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

        if (insertErr) {
          // If duplicate key error occurs, it's safe to ignore (profile already inserted)
          if (!insertErr.message.toLowerCase().includes('duplicate')) {
            console.error('Error creating user profile:', insertErr.message);
          }
        } else {
          console.info('Created user profile for', u.id);
        }
      }
    } catch (err) {
      console.error('Unexpected error in ensureProfileExists:', err);
    }
  };

  useEffect(() => {
    // Handle email confirmation redirects (the /auth/callback page)
    const handleRedirect = async () => {
      const hashParams = window.location.hash;
      if (hashParams.includes('access_token')) {
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        });
        if (error) {
          console.error('Error handling redirect:', error.message);
        } else {
          const confirmedUser = data.session?.user ?? null;
          setUser(confirmedUser);
          // Ensure profile after redirect-confirmed session
          await ensureProfileExists(confirmedUser);
        }

        // Clean up URL after processing
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleRedirect();

    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      // Ensure profile if a valid session exists on page load
      ensureProfileExists(currentUser);
    });

    // Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      // Ensure profile after auth state change (login/confirm)
      await ensureProfileExists(newUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // Sign up new user — DO NOT create profile immediately here to avoid race
  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) throw error;

    // NOTE: We intentionally do NOT insert into user_profiles here.
    // profile creation is handled in ensureProfileExists after the session is established.
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
