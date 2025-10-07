import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // ✅ Handle token exchange from Supabase redirect
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (error) {
          console.error('Error exchanging session:', error.message);
        } else {
          console.log('Session established for user:', data.session?.user?.email);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        // ✅ Redirect user to dashboard after processing
        navigate('/dashboard');
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-white">
      <p>Verifying your email, please wait...</p>
    </div>
  );
};
