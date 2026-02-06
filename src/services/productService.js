import { supabase } from '../config/supabase.js';

/**
 * Get products for a platform and brand
 */
export async function getProducts(platform, brand = 'pepe') {
  // Swiggy → use enriched DB view
  if (platform === 'swiggy') {
    const { data, error } = await supabase
      .from('swiggy_products_enriched')
      .select('*')
      .eq('brand', brand)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching swiggy products:', error);
      return [];
    }

    // Normalize url to avoid undefined edge cases
    return (data || []).map(p => ({
      ...p,
      url: p.url || null
    }));
  }

  // Other platforms unchanged
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('platform', platform)
    .eq('brand', brand)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

/**
 * Get benchmarks for a specific brand
 */
/**
 * Get benchmarks for a brand, grouped by platform + product_id
 */
export async function getBenchmarks(brand) {
  if (!brand) {
    throw new Error('brand is required in getBenchmarks');
  }

  const { data, error } = await supabase
    .from('benchmarks')
    .select(`
      product_id,
      name,
      platform,
      bau_price,
      event_price
    `)
    .eq('brand', brand);

  if (error) {
    console.error('Error fetching benchmarks:', error);
    return {};
  }

  /**
   * Structure:
   * benchmarks[platform][product_id] = {
   *   name,
   *   bau,
   *   event
   * }
   */
  const benchmarks = {};

  (data || []).forEach(row => {
    const { platform, product_id } = row;
    if (!platform || !product_id) return;

    if (!benchmarks[platform]) {
      benchmarks[platform] = {};
    }

    benchmarks[platform][product_id] = {
      name: row.name,
      bau: row.bau_price,
      event: row.event_price
    };
  });

  return benchmarks;
}

/**
 * Get historical stats for a platform and brand (last 14 days)
 */
export async function getHistoricalStats(platform, brandSlug) {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fromDate = fourteenDaysAgo.toISOString();

  const { data, error } = await supabase
    .from('price_history')
    .select('price, in_stock, recorded_at, product_id')
    .eq('platform', platform)
    .eq('brand', brandSlug)
    .gte('recorded_at', fromDate)
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Error fetching historical stats:', error);
    return [];
  }

  return data || [];
}

/**
 * Real-time subscription for products (optional)
 */
export function subscribeToProducts(platform, brand, callback) {
  const channel = supabase
    .channel('products')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `platform=eq.${platform} AND brand=eq.${brand}`
      },
      payload => callback(payload)
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Get 14-day price history for a specific product
 */
export async function getProductPriceHistory(skuId, platform, brandSlug, internalId) {
  const p = String(platform || '').trim();
  const s = String(skuId || '').trim();
  const b = String(brandSlug || '').trim();

  // 1. Try daily_price_history first (uses string SKU in product_id)
  const { data, error } = await supabase
    .from('daily_price_history')
    .select('price, recorded_date')
    .eq('product_id', s)
    .eq('platform', p)
    .ilike('brand', b)
    .order('recorded_date', { ascending: false })
    .limit(14);

  if (!error && data && data.length > 0) {
    return data;
  }

  if (error) {
    console.error('Error fetching from daily_price_history:', error);
  }

  // 2. Fallback to legacy price_history table (uses numeric primary key in product_id)
  // If internalId isn't provided, try to find it from the SKU
  let targetNumericId = internalId;
  if (!targetNumericId && s) {
    const { data: pData } = await supabase
      .from('products')
      .select('id')
      .eq('product_id', s)
      .eq('platform', p)
      .limit(1);

    if (pData && pData[0]) {
      targetNumericId = pData[0].id;
    }
  }

  if (!targetNumericId) {
    return [];
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from('price_history')
    .select('price, recorded_at')
    .eq('product_id', targetNumericId) // Numeric key
    .eq('platform', p)
    .ilike('brand', b)
    .order('recorded_at', { ascending: false })
    .limit(14);

  if (legacyError) {
    console.error('Error fetching legacy product price history:', legacyError);
    return [];
  }

  // Normalize legacy data (recorded_at -> recorded_date)
  return (legacyData || []).map(item => ({
    price: item.price,
    recorded_date: item.recorded_at
  }));
}