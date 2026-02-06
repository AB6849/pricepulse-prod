import { supabaseAdmin } from './supabaseAdmin.js';

/**
 * Save current prices to price history
 */
export async function savePriceHistory(products, platform, brand) {
  if (!products || products.length === 0) {
    return;
  }

  try {
    // Get current product IDs from database
    const { data: existingProducts, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, original_price, in_stock')
      .eq('platform', platform)
      .eq('brand', brand);

    if (fetchError) {
      console.error('Error fetching existing products:', fetchError);
      return;
    }

    // Create a map of product name -> product ID
    const productMap = new Map();
    existingProducts.forEach(p => {
      productMap.set(p.name.toLowerCase().trim(), p);
    });

    // Prepare price history records
    const historyRecords = products
      .filter(p => p.name && p.name !== 'NA')
      .map(product => {
        const normalizedName = product.name.toLowerCase().trim();
        const existingProduct = productMap.get(normalizedName);

        if (!existingProduct) {
          return null; // Product not found in database, skip
        }

        return {
          product_id: existingProduct.id,
          name: product.name,
          platform,
          brand,
          price: parseFloat(product.price || product.current_price) || 0,
          original_price: parseFloat(product.original_price) || null,
          in_stock: product.in_stock || null
        };
      })
      .filter(record => record !== null);

    if (historyRecords.length === 0) {
      console.log('No price history records to save');
      return;
    }

    // Insert price history
    const { error: insertError } = await supabaseAdmin
      .from('price_history')
      .insert(historyRecords);

    if (insertError) {
      console.error('Error saving price history:', insertError);
    } else {
      console.log(`✅ Saved price history for ${historyRecords.length} products`);
    }
  } catch (error) {
    console.error('Error in savePriceHistory:', error);
  }
}

/**
 * Detect price changes by comparing current prices with previous prices
 */
export async function detectPriceChanges(platform, brand) {
  try {
    // Get the most recent price history for each product
    const { data: currentPrices, error: currentError } = await supabaseAdmin
      .from('price_history')
      .select('*')
      .eq('platform', platform)
      .eq('brand', brand)
      .order('recorded_at', { ascending: false });

    if (currentError || !currentPrices || currentPrices.length === 0) {
      return [];
    }

    // Group by product name and get latest and previous prices
    const productChanges = [];
    const productGroups = new Map();

    // Group prices by product name
    currentPrices.forEach(record => {
      const key = record.name.toLowerCase().trim();
      if (!productGroups.has(key)) {
        productGroups.set(key, []);
      }
      productGroups.get(key).push(record);
    });

    // For each product, compare latest with previous
    for (const [productName, records] of productGroups.entries()) {
      if (records.length < 2) {
        continue; // Need at least 2 records to detect change
      }

      // Sort by recorded_at descending
      records.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

      const latest = records[0];
      const previous = records[1];

      // Check if price changed
      const priceChange = latest.price - previous.price;
      const priceChangePercent = previous.price > 0
        ? ((priceChange / previous.price) * 100).toFixed(2)
        : 0;

      // Check if stock status changed
      const stockChanged = latest.in_stock !== previous.in_stock;

      // Only report significant changes (>= 1% or stock change)
      if (Math.abs(priceChangePercent) >= 1 || stockChanged || priceChange !== 0) {
        productChanges.push({
          product_id: latest.product_id,
          name: latest.name,
          platform: latest.platform,
          brand: latest.brand,
          previous_price: previous.price,
          current_price: latest.price,
          price_change: priceChange,
          price_change_percent: parseFloat(priceChangePercent),
          previous_original_price: previous.original_price,
          current_original_price: latest.original_price,
          previous_stock: previous.in_stock,
          current_stock: latest.in_stock,
          stock_changed: stockChanged,
          recorded_at: latest.recorded_at
        });
      }
    }

    return productChanges;
  } catch (error) {
    console.error('Error detecting price changes:', error);
    return [];
  }
}

/**
 * Get price changes for all platforms and brands
 */
export async function getAllPriceChanges(brand = 'pepe') {
  const platforms = ['blinkit', 'swiggy', 'zepto'];
  const allChanges = [];

  for (const platform of platforms) {
    const changes = await detectPriceChanges(platform, brand);
    allChanges.push(...changes);
  }

  return allChanges;
}


/**
 * Save current prices to dedicated daily price history table
 * This table stores one record per product per day
 */
export async function saveDailyPriceHistory(products, platform, brand) {
  if (!products || products.length === 0) {
    return;
  }

  try {
    // Get date in Asia/Kolkata timezone (YYYY-MM-DD)
    const todayIST = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata'
    });

    console.log(`📊 Saving daily history for ${platform} (${brand}) on ${todayIST}...`);

    // Prepare history records for upsert (onConflict product_id, platform, brand, recorded_date)
    const historyRecords = products
      .filter(p => p.product_id && p.name && p.name !== 'NA')
      .map(product => {
        return {
          product_id: product.product_id,
          platform,
          brand,
          price: parseFloat(product.price || product.current_price) || 0,
          in_stock: !String(product.in_stock || '').toLowerCase().includes('out of stock'),
          recorded_date: todayIST
        };
      });

    if (historyRecords.length === 0) {
      console.log(`⚠️ No valid records for daily history (${platform}, ${brand})`);
      return;
    }

    // Upsert into daily_price_history
    const { error } = await supabaseAdmin
      .from('daily_price_history')
      .upsert(historyRecords, {
        onConflict: 'product_id,platform,brand,recorded_date'
      });

    if (error) {
      console.error('❌ Error saving daily price history:', error);
    } else {
      console.log(`✅ [DailyHistory] Upserted ${historyRecords.length} records for ${platform} on ${todayIST}`);
    }
  } catch (error) {
    console.error('❌ Error in saveDailyPriceHistory:', error);
  }
}
