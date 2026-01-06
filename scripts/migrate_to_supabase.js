import { parseCSV } from '../src/utils/csvParser.js';
import { upsertProducts } from '../src/services/productAdminService.js';
import { upsertBenchmark } from '../src/services/productAdminService.js';
import dotenv from 'dotenv';

dotenv.config();

const SHEET_ID = '17CaPQYQIpC5wG16lYWHRbCy04eRzYCjfK0a-wBM2z2c';

/**
 * Migrate products from Google Sheets to Supabase
 */
async function migrateProducts(sheetName, platform, brand) {
  console.log(`\n📥 Migrating ${sheetName} (${platform}, ${brand})...`);
  
  try {
    // Fetch from Google Sheets
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch ${sheetName} sheet: ${res.statusText}`);
    }
    
    const csv = await res.text();
    const rows = parseCSV(csv);
    
    if (rows.length < 2) {
      console.log(`⚠️ No data found in ${sheetName}`);
      return 0;
    }
    
    // Transform data based on sheet structure
    const products = rows.slice(1).map(row => {
      // Different sheets have different column orders
      if (platform === 'blinkit') {
        return {
          name: row[0] || 'NA',
          image: row[1] || null,
          price: parseFloat(row[2] || row[3]) || 0,
          original_price: parseFloat(row[3] || row[2]) || null,
          discount: row[4] || null,
          unit: row[5] || null,
          in_stock: row[6] || null
        };
      } else if (platform === 'swiggy') {
        return {
          name: row[0] || 'NA',
          unit: row[1] || null,
          price: parseFloat(row[2] || row[3]) || 0,
          original_price: parseFloat(row[3] || row[2]) || null,
          discount: row[4] || null,
          in_stock: row[5] || null,
          image: row[6] || null
        };
      } else if (platform === 'zepto') {
        return {
          name: row[0] || 'NA',
          image: row[1] || null,
          original_price: parseFloat(row[2]) || null,
          price: parseFloat(row[3]) || 0,
          discount: row[4] || null,
          unit: row[5] || null,
          in_stock: row[6] || null
        };
      }
    }).filter(p => p.name && p.name !== 'NA' && p.price >= 0); // Allow price 0 for OOS
    
    if (products.length === 0) {
      console.log(`⚠️ No valid products to migrate from ${sheetName}`);
      return 0;
    }
    
    // Insert into Supabase
    await upsertProducts(products, platform, brand);
    console.log(`✅ Migrated ${products.length} products from ${sheetName}`);
    
    return products.length;
  } catch (error) {
    console.error(`❌ Error migrating ${sheetName}:`, error.message);
    return 0;
  }
}

/**
 * Migrate benchmarks from Google Sheets to Supabase
 */
async function migrateBenchmarks(brand) {
  console.log(`\n📥 Migrating benchmarks for ${brand}...`);
  
  try {
    // Fetch benchmarks from Google Sheets
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=benchmarks`
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch benchmarks sheet: ${res.statusText}`);
    }
    
    const csv = await res.text();
    const rows = parseCSV(csv);
    
    if (rows.length < 2) {
      console.log(`⚠️ No benchmarks found`);
      return 0;
    }
    
    // Get header row to find column indices
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('product'));
    const blinkitIndex = headers.findIndex(h => h.includes('blinkit'));
    const swiggyIndex = headers.findIndex(h => h.includes('swiggy') || h.includes('instamart'));
    const zeptoIndex = headers.findIndex(h => h.includes('zepto'));
    
    if (nameIndex === -1) {
      throw new Error('Could not find product name column in benchmarks');
    }
    
    let migrated = 0;
    
    // Process each benchmark row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const productName = (row[nameIndex] || '').trim();
      
      if (!productName) continue;
      
      // Update benchmarks for each platform that has a price
      if (blinkitIndex !== -1 && row[blinkitIndex]) {
        const price = parseFloat(row[blinkitIndex]);
        if (!isNaN(price) && price > 0) {
          await upsertBenchmark(productName, brand, 'blinkit', price);
        }
      }
      
      if (swiggyIndex !== -1 && row[swiggyIndex]) {
        const price = parseFloat(row[swiggyIndex]);
        if (!isNaN(price) && price > 0) {
          await upsertBenchmark(productName, brand, 'swiggy', price);
        }
      }
      
      if (zeptoIndex !== -1 && row[zeptoIndex]) {
        const price = parseFloat(row[zeptoIndex]);
        if (!isNaN(price) && price > 0) {
          await upsertBenchmark(productName, brand, 'zepto', price);
        }
      }
      
      migrated++;
    }
    
    console.log(`✅ Migrated ${migrated} benchmarks for ${brand}`);
    return migrated;
  } catch (error) {
    console.error(`❌ Error migrating benchmarks:`, error.message);
    return 0;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting migration from Google Sheets to Supabase...\n');
  
  const brand = 'pepe'; // Change to 'chumbak' if needed
  
  try {
    // Migrate products
    const blinkitCount = await migrateProducts('blinkit', 'blinkit', brand);
    const swiggyCount = await migrateProducts('instamart', 'swiggy', brand);
    const zeptoCount = await migrateProducts('zepto', 'zepto', brand);
    
    // Migrate benchmarks
    await migrateBenchmarks(brand);
    
    console.log('\n✅ Migration complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Blinkit products: ${blinkitCount}`);
    console.log(`   - Swiggy products: ${swiggyCount}`);
    console.log(`   - Zepto products: ${zeptoCount}`);
    console.log(`   - Brand: ${brand}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate().catch(console.error);


