import { supabaseAdmin } from './supabaseAdmin.js';
import { savePriceHistory, detectPriceChanges } from './priceChangeService.js';
import { notifyPriceChanges } from './emailService.js';

/**
 * Insert / Update products in Supabase (true UPSERT)
 */
export async function upsertProducts(products, platform, brand) {
    const transformed = products
        .map(product => {
            const parsePrice = (val) => {
                if (!val || val === 'NA' || val === '') return null;
                const n = parseFloat(val);
                return isNaN(n) ? null : n;
            };

            const parseString = (val) =>
                !val || val === 'NA' || val === '' ? null : val;

            if (!product.product_id) return null; // 🔒 mandatory

            const isOOS =
                product.in_stock &&
                product.in_stock.toLowerCase().includes('out of stock');

            const safeName =
    typeof product.name === "string" && product.name.trim().length > 0
        ? product.name.trim()
        : "NA";

return {
    product_id: product.product_id,
    url: parseString(product.url),
    name: safeName, // 🔒 NEVER NULL
    image: parseString(product.image),
    price: parsePrice(product.current_price),
    original_price: parsePrice(product.original_price),
    discount: parseString(product.discount),
    unit: parseString(product.unit),
    in_stock: parseString(product.in_stock),
    platform,
    brand,
    updated_at: new Date().toISOString()
};

        })
.filter(p => p.name !== null)

    if (transformed.length === 0) {
        console.log(`⚠️ No valid products to upsert for ${platform} (${brand})`);
        return [];
    }

    const { data, error } = await supabaseAdmin
        .from('products')
        .upsert(transformed, {
            onConflict: 'platform,product_id,unit'
        })
        .select();

    if (error) {
        console.error('❌ Supabase upsert error:', error);
        throw error;
    }

    console.log(`✅ Upserted ${data.length} products (${platform}, ${brand})`);

    // ---- Price history + alerts (non-blocking) ----
    try {
        await savePriceHistory(products, platform, brand);
        const changes = await detectPriceChanges(platform, brand);

        if (changes.length > 0) {
            await notifyPriceChanges(changes, brand);
        }
    } catch (err) {
        console.error('⚠️ Price-change pipeline failed:', err.message);
    }

    return data;
}

/**
 * Update benchmark price
 */
export async function upsertBenchmark(productName, brand, platform, price) {
    const columnName = `${platform}_price`;

    const { error } = await supabaseAdmin
        .from('benchmarks')
        .upsert(
            {
                product_name: productName,
                brand,
                [columnName]: price,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'product_name,brand' }
        );

    if (error) {
        console.error('❌ Benchmark update failed:', error);
        throw error;
    }
}