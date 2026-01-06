import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

export default function AcceptInvite() {
  const { token } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error, needs_auth
  const [message, setMessage] = useState('');
  const [brandName, setBrandName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      acceptInvitation();
    } else {
      setStatus('needs_auth');
    }
  }, [isAuthenticated, token]);

  async function acceptInvitation() {
    try {
      setStatus('loading');
      setMessage('Accepting your invitation...');

      console.log('Accepting invitation with token:', token);
      console.log('Current user:', user);

      const { data, error } = await supabase
        .rpc('accept_invitation', { invite_token: token });

      console.log('Accept invitation result:', { data, error });

      if (error) throw error;

      if (data && data.success) {
        // Get brand name
        const { data: brand } = await supabase
          .from('brands')
          .select('brand_name')
          .eq('brand_id', data.brand_id)
          .single();

        setBrandName(brand?.brand_name || 'the brand');
        setStatus('success');
        setMessage(`Successfully joined ${brand?.brand_name || 'the brand'}!`);
        
        console.log('Invitation accepted successfully, redirecting...');
        
        // Force reload auth state before redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data?.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage(error.message || 'An error occurred while accepting the invitation');
    }
  }

  if (status === 'needs_auth') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">You've Been Invited!</h1>
            <p className="text-gray-300 mb-6">Sign in with Google to accept your invitation</p>
            <button
              onClick={() => navigate(`/login?redirect=/invite/${token}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Welcome!</h1>
              <p className="text-gray-300 mb-2">{message}</p>
              <p className="text-sm text-gray-400">Redirecting to home...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Wrong Account</h1>
              <p className="text-yellow-300 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    // Sign out current user
                    await supabase.auth.signOut();
                    // Redirect to login with invite token
                    navigate(`/login?redirect=/invite/${token}`);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Sign in with Correct Account
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Go to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
