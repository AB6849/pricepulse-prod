import { supabaseAdmin } from './supabaseAdmin.js';
import { savePriceHistory, detectPriceChanges, saveDailyPriceHistory } from './priceChangeService.js';
import { notifyPriceChanges } from './emailService.js';

/**
 * Insert / Update products in Supabase (true UPSERT)
 */
export async function upsertProducts(products, platform, brand) {
    const transformed = products
        .map(product => {
            const parsePrice = (val) => {
                if (val === null || val === undefined) return null;
                const n = Number(String(val).replace(/[^\d.]/g, ''));
                return Number.isFinite(n) ? n : null;
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

            const parsedPrice = parsePrice(product.price);

            return {
                product_id: product.product_id,
                url: parseString(product.url),
                name: safeName,
                image: parseString(product.image),
                ...(parsedPrice !== null ? { price: parsedPrice } : {}), // 👈 only send if valid
                original_price: parsePrice(product.original_price),
                discount: parseString(product.discount),
                unit: parseString(product.unit),
                in_stock: parseString(product.in_stock),
                platform,
                brand,
                updated_at: new Date().toISOString()
            };

        })
        .filter(p => p.name !== null);
    if (transformed.length === 0) {
        console.log(`⚠️ No valid products to insert for ${platform} (${brand})`);
        return [];
    }

    // Step 1: Delete existing products for this platform + brand
    const { error: deleteError } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('platform', platform)
        .eq('brand', brand);

    if (deleteError) {
        console.error('❌ Supabase delete error:', deleteError);
        throw deleteError;
    }

    // Step 2: Insert fresh product data
    const { data, error } = await supabaseAdmin
        .from('products')
        .insert(transformed)
        .select();

    if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
    }

    console.log(`✅ Refreshed ${data.length} products (${platform}, ${brand})`);

    // ---- Price history + alerts (non-blocking) ----
    try {
        await savePriceHistory(products, platform, brand);
        await saveDailyPriceHistory(products, platform, brand);
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