import { supabaseAdmin } from './supabaseAdmin.js';

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function resolveInstamartFromCatalog(scrapedProducts, brand) {
  if (!scrapedProducts.length) return [];

  const { data: catalog, error } = await supabaseAdmin
    .from('instamart_catalog')
    .select('product_id, name, url')
    .eq('brand', brand);

  if (error) throw error;

  const catalogMap = new Map(
    catalog.map(c => [normalizeName(c.name), c])
  );

  const resolved = [];
  const missed = [];

  for (const p of scrapedProducts) {
    const key = normalizeName(p.name);
    const match = catalogMap.get(key);

    if (!match) {
      missed.push(p.name);
      continue;
    }

    resolved.push({
      ...p,
      product_id: match.product_id,
      url: match.url
    });
  }

  if (missed.length) {
    console.warn(`⚠️ Instamart unmatched products: ${missed.length}`);
    missed.forEach(n => console.warn('  -', n));
  }

  return resolved;
}
