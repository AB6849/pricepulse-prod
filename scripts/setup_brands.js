import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Setup initial brands in the database
 */
async function setupBrands() {
  const brands = [
    { name: 'Pepe Jeans', slug: 'pepe' },
    { name: 'Chumbak', slug: 'chumbak' }
  ];

  console.log('🏢 Setting up brands...\n');

  for (const brand of brands) {
    try {
      const { data, error } = await supabaseAdmin
        .from('brands')
        .upsert({
          name: brand.name,
          slug: brand.slug
        }, {
          onConflict: 'slug'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error setting up ${brand.name}:`, error);
      } else {
        console.log(`✅ Brand created/updated: ${data.name} (${data.slug})`);
      }
    } catch (error) {
      console.error(`❌ Error:`, error);
    }
  }

  console.log('\n✅ Brand setup complete!');
}

setupBrands().catch(console.error);