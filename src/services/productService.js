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