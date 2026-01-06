import { supabase } from '../config/supabase';

/**
 * Get pricing mode (BAU / EVENT) for a brand + date range
 * Dates must be YYYY-MM-DD (Asia/Kolkata)
 */
export async function getPricingCalendar({
    brand,
    fromDate,
    toDate
}) {
    if (!brand) {
        throw new Error('brand is required in getPricingCalendar');
    }

    const { data, error } = await supabase
        .from('pricing_calendar')
        .select('date, platform, mode')
        .eq('brand', brand)
        .gte('date', fromDate)
        .lte('date', toDate);

    if (error) {
        console.error('Error fetching pricing calendar:', error);
        return {};
    }

    /**
     * Structure:
     * calendar[date][platform] = 'BAU' | 'EVENT'
     */
    const calendar = {};

    (data || []).forEach(row => {
        if (!calendar[row.date]) calendar[row.date] = {};
        calendar[row.date][row.platform] = row.mode;
    });

    return calendar;
}