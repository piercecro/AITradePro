import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      await supabase.auth.getSession();
      navigate('/dashboard');
    };
    handleRedirect();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-white">
      <p>Verifying your email, please wait...</p>
    </div>
  );
};
