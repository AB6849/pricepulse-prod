import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Add a user to a brand
 * Usage: node scripts/add_user_to_brand.js <email> <brand_slug> [role]
 * Example: node scripts/add_user_to_brand.js user@example.com pepe admin
 */
async function addUserToBrand(email, brandSlug, role = 'viewer') {
  if (!email || !brandSlug) {
    console.error('Please provide email and brand_slug');
    console.log('Usage: node scripts/add_user_to_brand.js <email> <brand_slug> [role]');
    console.log('Example: node scripts/add_user_to_brand.js user@example.com pepe admin');
    process.exit(1);
  }

  const validRoles = ['viewer', 'editor', 'admin'];
  if (!validRoles.includes(role)) {
    console.error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
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

    // Get brand by slug
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('brand_id, brand_name')
      .eq('brand_slug', brandSlug)
      .single();

    if (brandError || !brand) {
      console.error(`Brand with slug "${brandSlug}" not found.`);
      process.exit(1);
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          role: 'viewer'
        });

      if (createError) {
        throw createError;
      }
    }

    // Add user to brand
    const { data: userBrand, error: insertError } = await supabaseAdmin
      .from('user_brands')
      .upsert({
        user_id: user.id,
        brand_id: brand.brand_id,
        role: role
      }, { onConflict: 'user_id,brand_id' })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Successfully added ${email} to ${brand.brand_name} as ${role}`);
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Brand ID: ${brand.brand_id}`);
    console.log(`   - Role: ${role}`);
    
  } catch (error) {
    console.error('Error adding user to brand:', error);
    process.exit(1);
  }
}

// Run if called directly
const email = process.argv[2];
const brandSlug = process.argv[3];
const role = process.argv[4] || 'viewer';

if (email && brandSlug) {
  addUserToBrand(email, brandSlug, role).then(() => {
    console.log('Done!');
    process.exit(0);
  });
} else {
  console.log('Usage: node scripts/add_user_to_brand.js <email> <brand_slug> [role]');
  console.log('Example: node scripts/add_user_to_brand.js user@example.com pepe admin');
  process.exit(1);
}


