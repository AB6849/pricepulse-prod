import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create user profile WITHOUT adding to brands
 * This lets the invitation system handle brand access and roles
 * Usage: node scripts/create_user_profile_only.js <email>
 */

const EMAIL = process.argv[2];

if (!EMAIL) {
  console.log('Usage: node scripts/create_user_profile_only.js <email>');
  console.log('Example: node scripts/create_user_profile_only.js user@example.com');
  process.exit(1);
}

async function createProfileOnly() {
  console.log('👤 Creating user profile for:', EMAIL, '\n');

  try {
    // Find user in auth.users
    console.log('1️⃣ Looking for user in auth.users...');
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) throw usersError;
    
    const user = users.find(u => u.email === EMAIL);
    
    if (!user) {
      console.error(`❌ User ${EMAIL} not found in auth.users`);
      console.log('   They need to sign in with Google first');
      process.exit(1);
    }
    
    console.log(`   ✅ Found user: ${user.email} (ID: ${user.id})`);

    // Create profile as viewer (default)
    console.log('\n2️⃣ Creating user profile as viewer...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
        role: 'viewer' // Default role, invitation will grant brand access
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) throw profileError;
    console.log(`   ✅ Profile created: ${profile.email} (Global role: ${profile.role})`);

    // Check for pending invitations
    console.log('\n3️⃣ Checking for pending invitations...');
    const { data: invites, error: invitesError } = await supabaseAdmin
      .from('invitations')
      .select('*, brands(brand_name)')
      .eq('email', EMAIL)
      .eq('status', 'pending');

    if (invitesError) throw invitesError;

    if (!invites || invites.length === 0) {
      console.log('   ℹ️  No pending invitations');
      console.log('   User profile created but has no brand access yet');
    } else {
      console.log(`   ✅ Found ${invites.length} pending invitation(s):`);
      invites.forEach(inv => {
        console.log(`      - ${inv.brands?.brand_name} as ${inv.role}`);
      });
      console.log('\n   Run this to accept invitations:');
      console.log(`   node scripts/manual_accept_invite.js ${EMAIL}`);
    }

    console.log('\n✅ Done!');
    console.log('   User can now sign in, and invitations can be accepted');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

createProfileOnly();
