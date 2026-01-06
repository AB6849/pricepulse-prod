import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Debug why invitation acceptance is failing
 */

const EMAIL = 'amalbobby306@gmail.com';

async function debug() {
  console.log('🔍 Debugging invitation for:', EMAIL, '\n');

  try {
    // 1. Check if user exists
    console.log('1️⃣ Checking user profile...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', EMAIL)
      .single();

    if (userError) {
      console.log('   ❌ User not found:', userError.message);
      console.log('   Run: node scripts/manual_setup_user.js', EMAIL);
      return;
    }

    console.log('   ✅ User exists:');
    console.log('      ID:', user.id);
    console.log('      Name:', user.full_name);
    console.log('      Email:', user.email);
    console.log('');

    // 2. Check pending invitations
    console.log('2️⃣ Checking pending invitations...');
    const { data: invites, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .select('*, brands(brand_name)')
      .eq('email', EMAIL)
      .eq('status', 'pending');

    if (inviteError) throw inviteError;

    if (!invites || invites.length === 0) {
      console.log('   ℹ️  No pending invitations');
    } else {
      console.log(`   ✅ Found ${invites.length} pending invitation(s):`);
      invites.forEach(inv => {
        console.log(`      - ${inv.brands?.brand_name} as ${inv.role}`);
        console.log(`        Token: ${inv.token.substring(0, 20)}...`);
      });
    }
    console.log('');

    // 3. Check current brand access
    console.log('3️⃣ Checking current brand access...');
    const { data: userBrands, error: brandsError } = await supabaseAdmin
      .from('user_brands')
      .select('*, brands(brand_name)')
      .eq('user_id', user.id);

    if (brandsError) throw brandsError;

    if (!userBrands || userBrands.length === 0) {
      console.log('   ℹ️  User has no brand access yet');
    } else {
      console.log(`   ✅ User has access to ${userBrands.length} brand(s):`);
      userBrands.forEach(ub => {
        console.log(`      - ${ub.brands?.brand_name} as ${ub.role}`);
      });
    }
    console.log('');

    // 4. If there are pending invites, accept them
    if (invites && invites.length > 0) {
      console.log('4️⃣ Accepting invitations...');
      
      for (const invite of invites) {
        console.log(`   Processing ${invite.brands?.brand_name}...`);
        
        // Add to brand
        const { error: addError } = await supabaseAdmin
          .from('user_brands')
          .upsert({
            user_id: user.id,
            brand_id: invite.brand_id,
            role: invite.role
          }, { onConflict: 'user_id,brand_id' });

        if (addError) {
          console.log('      ❌ Error adding to brand:', addError.message);
          continue;
        }

        // Mark as accepted
        const { error: updateError } = await supabaseAdmin
          .from('invitations')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', invite.id);

        if (updateError) {
          console.log('      ❌ Error updating invitation:', updateError.message);
          continue;
        }

        console.log(`      ✅ Accepted! Now ${invite.role} for ${invite.brands?.brand_name}`);
      }
      
      console.log('\n✅ All invitations processed!');
      console.log('   Refresh /admin/users to see the user');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debug();