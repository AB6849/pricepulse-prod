import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Logo will be loaded from public folder

export default function Login() {
  const { signInWithGoogle, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for error in URL params
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Check if there's a redirect parameter (from invite link)
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  function getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth_failed':
        return 'Authentication failed. Please try again.';
      case 'no_session':
        return 'No session found. Please sign in again.';
      case 'session_failed':
        return 'Failed to create session. Please try again.';
      case 'callback_failed':
        return 'Callback processing failed. Please try again.';
      default:
        return 'An error occurred during sign in.';
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setError('');

      // Save redirect URL if present
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        sessionStorage.setItem('authRedirect', redirect);
      }

      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'An error occurred during sign in.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-main)]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-[480px] px-6">
        <div className="glass-card glass-panel p-12 flex flex-col items-center animate-reveal relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {/* Logo Section */}
          <div className="mb-14 w-full flex justify-center">
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative group">
              <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img
                src="/trabenfull.png"
                alt="Traen Logo"
                className="h-10 w-auto object-contain traben-logo relative z-10 transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Smart Price Monitoring</h1>
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.3em]">Track Price. Win Margins.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
              <i data-feather="alert-circle" className="w-4 h-4 inline-block mr-2 -mt-0.5"></i>
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-5 px-8 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-indigo-500/20 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-700" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Authorize with Google</span>
              </>
            )}
          </button>

          {/* Remember Me */}
          <div className="mt-10 flex items-center justify-center gap-3 cursor-pointer group w-full">
            <input
              type="checkbox"
              id="remember"
              className="w-5 h-5 rounded-lg border-white/10 bg-white/5 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer accent-indigo-500"
            />
            <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors cursor-pointer">
              Maintain Session for 30 Days
            </label>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            Secure Infrastructure Provided by <span className="text-zinc-400">Traben Systems</span>
          </p>
          <div className="flex justify-center gap-4 text-[9px] font-bold uppercase tracking-widest text-zinc-700">
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="w-[1px] h-3 bg-zinc-800"></span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Service Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
}