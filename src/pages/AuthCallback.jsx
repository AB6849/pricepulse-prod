import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (data.session) {
          // Wait a bit for profile to be created by trigger
          await new Promise(resolve => setTimeout(resolve, 2000));

          const redirect = sessionStorage.getItem('authRedirect');
          sessionStorage.removeItem('authRedirect');

          if (redirect) {
            navigate(redirect);
          } else {
            navigate('/');
          }
        } else {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const errorParam = hashParams.get('error');
          const errorDescription = hashParams.get('error_description');

          if (errorParam) {
            console.error('OAuth error:', errorParam, errorDescription);
            navigate(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`);
            return;
          }

          if (!accessToken) {
            navigate('/login?error=no_session');
            return;
          }

          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                navigate('/');
              } else {
                navigate('/login?error=session_failed');
              }
            });
          }, 1000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        navigate(`/login?error=${encodeURIComponent(err.message)}`);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>

      <div className="relative z-10 glass-card p-12 flex flex-col items-center animate-reveal">
        <div className="w-16 h-16 border-2 border-white/5 border-t-indigo-500 rounded-full animate-spin mb-10 shadow-2xl shadow-indigo-500/10" />
        <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Syncing Secure Bridge...</p>
      </div>
    </div>
  );
}