import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
      console.log('Pending invitations:', data);
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
      console.log('Fetching users for brand_id:', currentBrand.brand_id);

      const { data, error } = await supabase
        .rpc('get_brand_users', { target_brand_id: currentBrand.brand_id });

      console.log('Users query response:', { error, dataLength: data?.length, sampleData: data?.[0] });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      // Alert only if it's a "function not found" type error to help debug
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Please enter a valid email address');
      return;
    }

    if (!inviteBrand) {
      setInviteError('Please select a brand');
      return;
    }

    try {
      // Get selected brand info
      const selectedBrand = brands.find(b => b.brand_id === inviteBrand);

      // Create invitation in database
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

      // Send invitation email
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
          } else {
            console.error('Failed to send email, but invitation created');
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          // Continue anyway - invitation is created
        }
      }

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteBrand('');
      setInviteError('');

      if (emailSent) {
        alert(`Invitation sent to ${inviteEmail} for ${selectedBrand?.brand_name}!`);
      } else {
        alert(`Invitation created for ${inviteEmail}, but automated email failed. Please contact admin.`);
      }
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
      console.log('Removing user_brand ID:', userBrandId);

      const { error, data } = await supabase
        .from('user_brands')
        .delete()
        .eq('id', userBrandId)
        .select();

      console.log('Delete result:', { error, deleted: data });

      if (error) throw error;

      console.log('✅ User removed successfully');

      // Immediately update the UI
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userBrandId));

      // Also reload to confirm
      loadUsers();
      loadPendingInvites();
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user: ' + error.message);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
        <div className="text-center">
          <p className="text-white text-xl mb-2">Access Denied</p>
          <p className="text-gray-400">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">Manage users for {currentBrand?.brand_name || 'your brand'}</p>
          </div>
          <button
            onClick={() => {
              setShowInviteModal(true);
              setInviteError('');
              setInviteBrand(currentBrand?.brand_id || '');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + Invite User
          </button>
        </div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/30 mb-6">
            <h2 className="text-lg font-semibold text-yellow-400 mb-3">Pending Invitations ({pendingInvites.length})</h2>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{invite.email}</span>
                  <span className="text-gray-400">({invite.role}) - Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-white mb-4">Active Users</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-white font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Role</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No users found for this brand. Click "Invite User" to add someone.
                    </td>
                  </tr>
                ) : (
                  users.map((userBrand) => {
                    console.log('Rendering user:', userBrand);
                    const profile = userBrand.user_profiles;
                    return (
                      <tr key={userBrand.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4 text-gray-300">
                          {profile?.full_name || profile?.email?.split('@')[0] || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {profile?.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={userBrand.role}
                            onChange={(e) => updateUserRole(userBrand.id, e.target.value)}
                            className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => removeUser(userBrand.id)}
                            className="text-red-400 hover:text-red-300 text-sm hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteBrand('');
                setInviteError('');
              }
            }}
          >
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Invite User</h2>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteBrand('');
                    setInviteError('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {inviteError && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm">
                    {inviteError}
                  </div>
                )}
                <div>
                  <label className="block text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteError('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        inviteUser();
                      }
                    }}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="user@example.com"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">User will receive an email invitation</p>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Brand</label>
                  <select
                    value={inviteBrand}
                    onChange={(e) => setInviteBrand(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a brand...</option>
                    {brands && brands.map((brand) => (
                      <option key={brand.brand_id} value={brand.brand_id}>
                        {brand.brand_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="editor">Editor (Can edit benchmarks)</option>
                    <option value="admin">Admin (Can manage users)</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={inviteUser}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Invite
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail('');
                      setInviteBrand('');
                      setInviteError('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}