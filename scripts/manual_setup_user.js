import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Manually setup user profile and add to brands
 * Use this if the automatic trigger didn't work
 * Usage: node scripts/manual_setup_user.js <email>
 */

const EMAIL = process.argv[2] || 'amal.bobby@goatbrandlabs.com';

async function manualSetup() {
  console.log('🔧 Manual User Setup\n');
  console.log(`Email: ${EMAIL}\n`);

  try {
    // Step 1: Find user in auth.users
    console.log('1️⃣ Looking for user in auth.users...');
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) throw usersError;
    
    const user = users.find(u => u.email === EMAIL);
    
    if (!user) {
      console.error(`❌ User ${EMAIL} not found in auth.users`);
      console.log('   Please sign in first at http://localhost:3000/login');
      process.exit(1);
    }
    
    console.log(`   ✅ Found user: ${user.email} (ID: ${user.id})`);

    // Step 2: Create or update user profile
    console.log('\n2️⃣ Creating user profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        role: 'super_admin'
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) throw profileError;
    console.log(`   ✅ Profile created: ${profile.email} (Role: ${profile.role})`);

    // Step 3: Get all brands
    console.log('\n3️⃣ Getting brands...');
    const { data: brands, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('*');

    if (brandsError) throw brandsError;
    
    if (!brands || brands.length === 0) {
      console.log('   ⚠️  No brands found, creating default brands...');
      
      const { data: newBrands, error: insertError } = await supabaseAdmin
        .from('brands')
        .insert([
          { brand_name: 'Pepe Jeans', brand_slug: 'pepe' },
          { brand_name: 'Chumbak', brand_slug: 'chumbak' }
        ])
        .select();

      if (insertError) throw insertError;
      brands.push(...newBrands);
    }

    console.log(`   ✅ Found ${brands.length} brand(s):`);
    brands.forEach(b => console.log(`      - ${b.brand_name} (${b.brand_slug})`));

    // Step 4: Add user to all brands
    console.log('\n4️⃣ Adding user to all brands...');
    const userBrands = brands.map(brand => ({
      user_id: user.id,
      brand_id: brand.brand_id,
      role: 'admin'
    }));

    const { error: userBrandsError } = await supabaseAdmin
      .from('user_brands')
      .upsert(userBrands, { onConflict: 'user_id,brand_id' });

    if (userBrandsError) throw userBrandsError;
    
    console.log(`   ✅ Added to ${brands.length} brand(s) as admin`);

    // Step 5: Verify
    console.log('\n5️⃣ Verifying setup...');
    const { data: userBrandsList, error: verifyError } = await supabaseAdmin
      .rpc('get_user_brands', { user_uuid: user.id });

    if (verifyError) {
      console.log('   ⚠️  Could not verify with get_user_brands function');
    } else {
      console.log(`   ✅ User can access ${userBrandsList.length} brand(s):`);
      userBrandsList.forEach(b => console.log(`      - ${b.brand_name} (${b.role})`));
    }

    console.log('\n✅ Setup complete!');
    console.log('   Now refresh your browser at http://localhost:3000');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

if (!EMAIL || EMAIL === 'amal.bobby@goatbrandlabs.com') {
  console.log('Usage: node scripts/manual_setup_user.js <email>');
  console.log('Example: node scripts/manual_setup_user.js amalbobby306@gmail.com');
  process.exit(1);
}

manualSetup();
