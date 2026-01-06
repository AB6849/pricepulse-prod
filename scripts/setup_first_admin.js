import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Setup first super admin user
 * Run this after a user signs up to make them a super admin
 */
async function setupFirstAdmin(email) {
  if (!email) {
    console.error('Please provide an email address');
    console.log('Usage: node scripts/setup_first_admin.js <email>');
    process.exit(1);
  }

  try {
    // Get user by email from auth.users
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      throw userError;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`User with email ${email} not found. They need to sign up first.`);
      process.exit(1);
    }

    // Update user profile to super_admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: 'super_admin' })
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    // Get all brands and add user to all of them as admin
    const { data: brands, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('brand_id');

    if (brandsError) {
      throw brandsError;
    }

    // Add user to all brands as admin
    if (brands && brands.length > 0) {
      const userBrands = brands.map(brand => ({
        user_id: user.id,
        brand_id: brand.brand_id,
        role: 'admin'
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_brands')
        .upsert(userBrands, { onConflict: 'user_id,brand_id' });

      if (insertError) {
        throw insertError;
      }
    }

    console.log(`✅ Successfully set ${email} as super admin`);
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Role: super_admin`);
    console.log(`   - Added to ${brands?.length || 0} brand(s) as admin`);
    
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

// Run if called directly
const email = process.argv[2];
if (email) {
  setupFirstAdmin(email).then(() => {
    console.log('Done!');
    process.exit(0);
  });
} else {
  console.log('Usage: node scripts/setup_first_admin.js <email>');
  console.log('Example: node scripts/setup_first_admin.js amal.bobby@goatbrandlabs.com');
  process.exit(1);
}


