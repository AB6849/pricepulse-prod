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
      setMessage('Decrypting Invitation...');

      const { data, error } = await supabase
        .rpc('accept_invitation', { invite_token: token });

      if (error) throw error;

      if (data && data.success) {
        const { data: brand } = await supabase
          .from('brands')
          .select('brand_name')
          .eq('brand_id', data.brand_id)
          .single();

        setBrandName(brand?.brand_name || 'the brand');
        setStatus('success');
        setMessage(`SUCCESS: Joined ${brand?.brand_name || 'Registry'}`);

        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data?.error || 'Registry Access Denied');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage(error.message || 'Transmission Error');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="glass-card p-12 flex flex-col items-center text-center animate-reveal relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {status === 'loading' && (
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-10" />
              <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/10">
                <i data-feather="check-circle" className="w-10 h-10 text-emerald-400"></i>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Access Granted</h1>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">{message}</p>
              <div className="w-full flex items-center gap-3 justify-center bg-white/5 py-3 px-6 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,1)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Initializing Core Systems...</span>
              </div>
            </>
          )}

          {status === 'needs_auth' && (
            <>
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/20">
                <i data-feather="mail" className="w-10 h-10 text-indigo-400"></i>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Identity Required</h1>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-12 leading-relaxed">You've been authorized to join Traben Systems Registry</p>

              <button
                onClick={() => navigate(`/login?redirect=/invite/${token}`)}
                className="w-full bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-4 hover:bg-zinc-100"
              >
                <i data-feather="log-in" className="w-4 h-4"></i>
                Verify Identity
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-10 shadow-2xl shadow-red-500/10">
                <i data-feather="alert-octagon" className="w-10 h-10 text-red-400"></i>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Registry Refused</h1>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-12 leading-relaxed">{message}</p>

              <div className="w-full flex flex-col gap-4">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate(`/login?redirect=/invite/${token}`);
                  }}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
                >
                  Switch Identity
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all"
                >
                  Return to Base
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
