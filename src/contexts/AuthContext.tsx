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

  useEffect(() => {
    // ✅ Handle email confirmation redirects (the /auth/callback page)
    const handleRedirect = async () => {
      const hashParams = window.location.hash;
      if (hashParams.includes('access_token')) {
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        });
        if (error) console.error('Error handling redirect:', error.message);
        else setUser(data.session?.user ?? null);

        // Clean up URL after processing
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleRedirect();

    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Sign in existing user
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // ✅ Sign up new user + automatically create profile
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

    // ✅ Automatically create matching user_profiles row
    if (data?.user) {
      const { error: profileError } = await supabase.from('user_profiles').insert([
        {
          id: data.user.id, // same ID as in auth.users
          username,
          email,
          available_balance: 0,
          total_deposited: 0,
          total_withdrawn: 0,
          total_profit: 0,
          role: 'user',
        },
      ]);

      if (profileError && !profileError.message.includes('duplicate key')) {
        console.error('Error creating user profile:', profileError.message);
        throw profileError;
      }
    }
  };

  // ✅ Sign out
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
