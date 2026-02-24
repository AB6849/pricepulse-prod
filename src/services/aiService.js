/**
 * AI Service — Frontend bridge to Traben AI endpoints
 * Handles caching, error handling, and data preparation
 */

const INSIGHT_CACHE_KEY = 'traben_ai_insights';
const FORECAST_CACHE_KEY = 'traben_ai_forecast';
const INSIGHT_CACHE_HOURS = 6;
const FORECAST_CACHE_HOURS = 12;

// ==========================================
// CACHE HELPERS
// ==========================================
function getCached(key, maxAgeHours) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw);
        const ageMs = Date.now() - timestamp;
        if (ageMs > maxAgeHours * 60 * 60 * 1000) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function setCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
        // localStorage full — silently fail
    }
}

// ==========================================
// ASK TRABEN (Chat)
// ==========================================
export async function askTraben(question, { brandData, platform, brandName, pageContext } = {}) {
    const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question,
            brandData: brandData || null,
            platform: platform || 'all',
            brandName: brandName || 'Unknown',
            pageContext: pageContext || 'Dashboard'
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'AI service unavailable');
    }

    return await response.json();
}

// ==========================================
// AI INSIGHTS (Auto-generated)
// ==========================================
export async function getAIInsights(platform, brandName, metrics, forceRefresh = false) {
    const cacheKey = `${INSIGHT_CACHE_KEY}_${platform}_${brandName}`;

    if (!forceRefresh) {
        const cached = getCached(cacheKey, INSIGHT_CACHE_HOURS);
        if (cached) return cached;
    }

    const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, brandName, metrics })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Failed to generate insights');
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
}

// ==========================================
// DEMAND FORECAST
// ==========================================
export async function getDemandForecast(brandName, platform, nuclearItems, forceRefresh = false) {
    const cacheKey = `${FORECAST_CACHE_KEY}_${platform}_${brandName}`;

    if (!forceRefresh) {
        const cached = getCached(cacheKey, FORECAST_CACHE_HOURS);
        if (cached) return cached;
    }

    const response = await fetch('/api/ai-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, platform, nuclearItems })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Failed to generate forecast');
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
}

// ==========================================
// DATA CONTEXT BUILDER
// Prepares summarized data for AI (keeps tokens low)
// ==========================================
export function buildAnalyticsContext({ salesSummary, citySales, nuclearData, facilityInventory, stats }) {
    const context = {};

    if (stats) {
        context.overview = {
            total_units_sold: stats.totalSales,
            gross_revenue: stats.totalRevenue,
            unique_skus: stats.uniqueProducts,
            cities_covered: stats.citiesCovered,
            risk_items: stats.riskItems
        };
    }

    if (salesSummary && salesSummary.length > 0) {
        context.top_products = salesSummary.slice(0, 10).map(p => ({
            name: p.item_name,
            qty: p.total_qty,
            revenue: p.total_revenue,
            cities: p.city_count
        }));
    }

    if (citySales && citySales.length > 0) {
        context.city_breakdown = citySales.slice(0, 8).map(c => ({
            city: c.city,
            qty: c.total_qty
        }));
    }

    if (nuclearData && nuclearData.items) {
        context.stockout_risks = nuclearData.items
            .filter(i => i.status === 'Critical')
            .slice(0, 5)
            .map(i => ({
                name: i.item_name,
                doh: i.doh,
                drr: i.drr,
                inventory: i.current_inv
            }));
        context.avg_doh = nuclearData.kpis?.avgDOH;
        context.critical_items = nuclearData.kpis?.criticalItems;
    }

    if (facilityInventory && facilityInventory.length > 0) {
        context.top_facilities = facilityInventory.slice(0, 5).map(f => ({
            name: f.facility,
            total_stock: f.total_inv,
            sku_count: f.sku_count
        }));
    }

    return context;
}

// ==========================================
// INSIGHTS METRICS BUILDER
// Summarizes analytics data for the insights endpoint
// ==========================================
export function buildInsightsMetrics({ salesSummary, citySales, nuclearData, dailyTrend, stats }) {
    return {
        stats: stats || {},
        top_5_products: (salesSummary || []).slice(0, 5).map(p => ({
            name: p.item_name,
            qty: p.total_qty,
            revenue: p.total_revenue
        })),
        top_cities: (citySales || []).slice(0, 5).map(c => ({
            city: c.city,
            qty: c.total_qty
        })),
        nuclear_summary: nuclearData ? {
            critical: nuclearData.kpis?.criticalItems || 0,
            avg_doh: nuclearData.kpis?.avgDOH || 0,
            top_risks: (nuclearData.items || []).filter(i => i.status === 'Critical').slice(0, 3).map(i => i.item_name)
        } : null,
        trend_direction: (() => {
            if (!dailyTrend || dailyTrend.length < 4) return 'insufficient_data';
            const mid = Math.floor(dailyTrend.length / 2);
            const firstHalf = dailyTrend.slice(0, mid).reduce((s, d) => s + (d.qty || 0), 0) / mid;
            const secondHalf = dailyTrend.slice(mid).reduce((s, d) => s + (d.qty || 0), 0) / (dailyTrend.length - mid);
            return secondHalf > firstHalf * 1.1 ? 'growing' : secondHalf < firstHalf * 0.9 ? 'declining' : 'stable';
        })()
    };
}
