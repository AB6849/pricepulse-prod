import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Handle the OAuth callback - exchange code for session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (data.session) {
          // Wait a bit for profile to be created by trigger
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check for saved redirect
          const redirect = sessionStorage.getItem('authRedirect');
          sessionStorage.removeItem('authRedirect');

          if (redirect) {
            navigate(redirect);
          } else {
            navigate('/');
          }
        } else {
          // Try to get session from URL hash
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
            // No session found
            navigate('/login?error=no_session');
            return;
          }

          // Session should be set automatically by Supabase, retry
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
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </div>
  );
}