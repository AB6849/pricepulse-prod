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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      {/* Comets Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-500 rounded-full opacity-80"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animation: `cometFall ${Math.random() * 15 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
              boxShadow: '0 0 12px rgba(102, 126, 234, 0.9)'
            }}
          />
        ))}
      </div>

      {/* Login Container */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
          style={{
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(102, 126, 234, 0.2)'
          }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/trabenfull.png"
              alt="Traen Logo"
              className="w-90 h-20 mx-auto mb-1 filter brightness-0 invert drop-shadow-lg"
              style={{
                filter: 'invert(1) brightness(1.8) drop-shadow(0 0 10px rgba(147, 51, 234, 0.7))'
              }}
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <p className="text-gray-400">Sign in with your authorized Google account</p>
          </div>

          {/* Google Sign In Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm text-center mb-4">
              {error}
            </div>
          )}

          {/* Remember Me */}
          <div className="flex items-center justify-center mt-6">
            <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-800" />
              <span>Remember me for 5 days</span>
            </label>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cometFall {
          0% {
            transform: translateY(-100px) translateX(-100px) rotate(45deg);
            opacity: 0;
          }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% {
            transform: translateY(100vh) translateX(100vw) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}