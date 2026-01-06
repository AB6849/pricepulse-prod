import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Manually accept an invitation (for debugging)
 * Usage: node scripts/manual_accept_invite.js <email>
 */

const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/manual_accept_invite.js <email>');
  console.log('Example: node scripts/manual_accept_invite.js amalbobby306@gmail.com');
  process.exit(1);
}

async function manualAccept() {
  try {
    console.log(`🔍 Looking for pending invitation for ${email}...\n`);

    // Find pending invitation
    const { data: invitations, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .select('*, brands(brand_name)')
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (inviteError) throw inviteError;

    if (!invitations || invitations.length === 0) {
      console.log('❌ No pending invitations found for this email');
      process.exit(1);
    }

    const invitation = invitations[0];
    console.log('✅ Found invitation:');
    console.log(`   Brand: ${invitation.brands?.brand_name}`);
    console.log(`   Role: ${invitation.role}`);
    console.log(`   Token: ${invitation.token}\n`);

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.log('❌ User not found. They need to sign in first.');
      console.log(`   Invite link: ${process.env.VITE_APP_URL || 'http://localhost:3000'}/invite/${invitation.token}`);
      process.exit(1);
    }

    console.log('✅ Found user:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.full_name}\n`);

    // Add user to brand
    console.log('➕ Adding user to brand...');
    const { error: userBrandError } = await supabaseAdmin
      .from('user_brands')
      .upsert({
        user_id: user.id,
        brand_id: invitation.brand_id,
        role: invitation.role
      }, { onConflict: 'user_id,brand_id' });

    if (userBrandError) throw userBrandError;
    console.log('   ✅ User added to brand\n');

    // Mark invitation as accepted
    console.log('✅ Marking invitation as accepted...');
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({ 
        status: 'accepted', 
        accepted_at: new Date().toISOString() 
      })
      .eq('id', invitation.id);

    if (updateError) throw updateError;
    console.log('   ✅ Invitation marked as accepted\n');

    console.log('🎉 Success!');
    console.log(`   ${user.full_name} (${user.email}) is now a ${invitation.role} for ${invitation.brands?.brand_name}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

manualAccept();
