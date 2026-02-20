import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

export default function AdminUsers() {
  const { currentBrand, isAdmin, loading: authLoading, profile, brands } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteBrand, setInviteBrand] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
    loadPendingInvites();
  }, [currentBrand, isAdmin]);

  async function loadPendingInvites() {
    if (!currentBrand) return;

    try {
      const { data, error } = await supabase
        .rpc('get_brand_invitations', { target_brand_id: currentBrand.brand_id });

      if (error) throw error;
      setPendingInvites(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      setPendingInvites([]);
    }
  }

  async function loadUsers() {
    if (!currentBrand) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_brand_users', { target_brand_id: currentBrand.brand_id });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      if (error.message && (error.message.includes('function') || error.message.includes('not found') || error.code === '42883')) {
        alert('Error: The "get_brand_users" database function is missing. Please run the "fix_user_visibility.sql" script in Supabase.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function inviteUser() {
    if (!inviteEmail || !inviteBrand) return;

    setInviteError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Please enter a valid email address');
      return;
    }

    try {
      const selectedBrand = brands.find(b => b.brand_id === inviteBrand);

      const { data, error } = await supabase
        .rpc('create_invitation', {
          target_email: inviteEmail,
          target_brand_id: inviteBrand,
          target_role: inviteRole
        });

      if (error) throw error;

      if (data && !data.success) {
        setInviteError(data.error || 'Failed to create invitation');
        return;
      }

      let emailSent = false;
      if (data && data.success) {
        try {
          const response = await fetch('/api/send-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: inviteEmail,
              brandName: data.brand_name || selectedBrand?.brand_name || 'PricePulse',
              token: data.token,
              inviterName: profile?.full_name || profile?.email || 'Admin'
            })
          });

          if (response.ok) {
            emailSent = true;
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError);
        }
      }

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteBrand('');
      setInviteError('');

      alert(emailSent
        ? `Invitation sent to ${inviteEmail} for ${selectedBrand?.brand_name}!`
        : `Invitation created for ${inviteEmail}, but automated email failed. Please contact admin.`);

      loadUsers();
      loadPendingInvites();
    } catch (error) {
      console.error('Error inviting user:', error);
      setInviteError('Failed to invite user: ' + error.message);
    }
  }

  async function updateUserRole(userBrandId, newRole) {
    try {
      const { error } = await supabase
        .from('user_brands')
        .update({ role: newRole })
        .eq('id', userBrandId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role: ' + error.message);
    }
  }

  async function removeUser(userBrandId) {
    if (!confirm('Are you sure you want to remove this user from the brand?')) return;

    try {
      const { error } = await supabase
        .from('user_brands')
        .delete()
        .eq('id', userBrandId);

      if (error) throw error;
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userBrandId));
      loadUsers();
      loadPendingInvites();
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user: ' + error.message);
    }
  }

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-card p-12 flex flex-col items-center animate-reveal">
          <div className="w-12 h-12 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-400 font-medium tracking-wide uppercase text-[10px]">Accessing Registry...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass-card p-10 flex flex-col items-center text-center animate-reveal max-w-md border-red-500/20">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <i data-feather="lock" className="w-8 h-8 text-red-400"></i>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Access Restricted</h2>
          <p className="text-zinc-500 text-sm font-medium mb-8">This module requires administrative privileges. Please contact your system administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-10 pt-[56px] pb-8 flex-1 flex flex-col" key="admin-users-v1">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10 overflow-hidden">
        <div className="flex items-center gap-6 animate-reveal">
          <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center shadow-2xl shadow-indigo-500/10 active:scale-95 transition-transform duration-300">
            <i data-feather="users" className="w-8 h-8 text-indigo-400"></i>
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white tracking-tight">User Management</h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Registry Control / {currentBrand?.brand_name}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setInviteError('');
            setInviteBrand(currentBrand?.brand_id || '');
          }}
          className="flex items-center gap-3 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 active:scale-95 animate-reveal"
          style={{ animationDelay: '0.1s' }}
        >
          <i data-feather="user-plus" className="w-4 h-4"></i>
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 animate-reveal" style={{ animationDelay: '0.2s' }}>
        {/* Main User List */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass-card flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Active Members</h2>
              <span className="text-[9px] font-black text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg bg-indigo-500/10">
                {users.length} TOTAL
              </span>
            </div>

            <div className="overflow-x-auto flex-1 p-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Registry...</p>
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left">
                      <th className="py-3 px-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Member Identity</th>
                      <th className="py-3 px-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Authority Level</th>
                      <th className="py-3 px-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Registry Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-24 text-center">
                          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">No members found in this registry</p>
                        </td>
                      </tr>
                    ) : (
                      users.map((userBrand) => {
                        const profile = userBrand.user_profiles;
                        return (
                          <tr key={userBrand.id} className="group transition-all">
                            <td className="py-4 px-6 first:rounded-l-2xl border-y border-l border-white/5 bg-white/[0.01] group-hover:bg-white/[0.03]">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                                  {profile?.full_name || profile?.email?.split('@')[0] || 'Anonymous'}
                                </span>
                                <span className="text-[10px] font-medium text-zinc-500 mt-0.5">{profile?.email}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 border-y border-white/5 bg-white/[0.01] group-hover:bg-white/[0.03]">
                              <select
                                value={userBrand.role}
                                onChange={(e) => updateUserRole(userBrand.id, e.target.value)}
                                className="bg-black/20 text-[9px] font-black text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg focus:ring-0 cursor-pointer hover:bg-indigo-500 hover:text-white transition-all uppercase tracking-widest outline-none"
                              >
                                <option value="viewer" className="bg-[#0a0a14]">Viewer</option>
                                <option value="editor" className="bg-[#0a0a14]">Editor</option>
                                <option value="admin" className="bg-[#0a0a14]">Admin</option>
                              </select>
                            </td>
                            <td className="py-4 px-6 last:rounded-r-2xl border-y border-r border-white/5 bg-white/[0.01] group-hover:bg-white/[0.03] text-right">
                              <button
                                onClick={() => removeUser(userBrand.id)}
                                className="text-red-400/50 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20"
                              >
                                Revoke Access
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Pending Invitations */}
        <div className="flex flex-col gap-8">
          <div className="glass-card flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Pending Requests</h2>
            </div>
            <div className="p-5 space-y-4">
              {pendingInvites.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-3">
                  <i data-feather="mail" className="w-6 h-6 text-zinc-700"></i>
                  <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">No Pending Invitations</p>
                </div>
              ) : (
                pendingInvites.map((invite) => (
                  <div key={invite.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[11px] font-bold text-white truncate max-w-[160px]">{invite.email}</span>
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">Pending</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-black text-zinc-500 uppercase tracking-wider relative z-10">
                      <span className="bg-indigo-500/10 px-2 py-1 rounded-md text-indigo-400 border border-indigo-500/10">{invite.role}</span>
                      <span>Expires {new Date(invite.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tip */}
          <div className="glass-card p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/10">
              <i data-feather="info" className="w-5 h-5 text-indigo-400"></i>
            </div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest mb-3">Registry Authority</h3>
            <p className="text-zinc-500 text-[11px] font-medium leading-relaxed opacity-80">
              <strong className="text-white">Editors</strong> can manage platform benchmarks. <strong className="text-white">Admins</strong> have full operational control over the brand registry.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-reveal" onClick={() => setShowInviteModal(false)}></div>
          <div className="glass-card bg-[#0a0a14] w-full max-w-md p-10 relative animate-reveal-up overflow-hidden shadow-2xl shadow-black/50" style={{ background: '#0d0d18', backgroundImage: 'none' }} onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Invite Member</h2>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Brand Registry Expansion</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all active:scale-90"
              >
                <i data-feather="x" className="w-5 h-5"></i>
              </button>
            </div>

            <div className="space-y-6">
              {inviteError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 animate-shake">
                  <i data-feather="alert-triangle" className="w-5 h-5 flex-shrink-0"></i>
                  <span>{inviteError}</span>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Member Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError('');
                  }}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:border-indigo-500/30 text-white text-sm font-medium placeholder:text-zinc-700 outline-none transition-all"
                  placeholder="identity@organization.com"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Registry Context</label>
                <select
                  value={inviteBrand}
                  onChange={(e) => setInviteBrand(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:border-indigo-500/30 text-white text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="" className="bg-[#0a0a14]">Select brand target...</option>
                  {brands && brands.map((brand) => (
                    <option key={brand.brand_id} value={brand.brand_id} className="bg-[#0a0a14]">
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Authority Level</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:border-indigo-500/30 text-white text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="viewer" className="bg-[#0a0a14]">Viewer (READ-ONY)</option>
                  <option value="editor" className="bg-[#0a0a14]">Editor (WRITE ACCESS)</option>
                  <option value="admin" className="bg-[#0a0a14]">Admin (FULL CONTROL)</option>
                </select>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                <button
                  onClick={inviteUser}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.3em] py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-500/30 active:scale-[0.97]"
                >
                  Confirm Invitation
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}