import { supabase } from '../config/supabase';
import Papa from 'papaparse';

/**
 * Parse CSV file to JSON array
 */
export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    reject(new Error(results.errors[0].message));
                } else {
                    resolve(results.data);
                }
            },
            error: (error) => reject(error)
        });
    });
}

/**
 * Parse date from DD/MM/YY or DD-MM-YYYY format to ISO date
 * Also handles YYYY-MM-DD format
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    const cleanDate = String(dateStr).trim();

    // Check for DD/MM/YYYY or DD-MM-YYYY (where day is first)
    // We assume if separator is at index 1 or 2, it's DD-MM-YYYY
    const sepMatch = cleanDate.match(/[\/\-]/);
    if (sepMatch) {
        const separator = sepMatch[0];
        const parts = cleanDate.split(separator);

        // If year is not at the start (standard for most retail reports)
        if (parts.length === 3 && parts[0].length <= 2) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            let year = parseInt(parts[2].split(' ')[0], 10); // Handle "26-01-2026 12:00:00"

            if (year < 100) year = 2000 + year;
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
        }
    }

    // Try YYYY-MM-DD or other standard formats
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];

    return null;
}

/**
 * Clean numeric string from commas, currency symbols, etc.
 */
function cleanNum(val) {
    if (val === undefined || val === null || val === '') return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    return cleaned || 0;
}

/**
 * Get value from row with flexible column name matching
 */
function getColumn(row, ...possibleNames) {
    for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== '') {
            return row[name];
        }
        // Try case-insensitive match
        const lowerName = name.toLowerCase();
        for (const key of Object.keys(row)) {
            if (key.toLowerCase() === lowerName || key.toLowerCase().replace(/\s/g, '_') === lowerName.replace(/\s/g, '_')) {
                if (row[key] !== undefined && row[key] !== '') {
                    return row[key];
                }
            }
        }
    }
    return '';
}

/**
 * Check for existing dates in the database for a given platform and brand
 * Returns an object with overlapping dates found
 */
export async function checkExistingDates(platform, brand, rows, type = 'sales') {
    const tablePrefix = platform === 'swiggy' ? 'instamart' : platform;
    const dateColumn = type === 'sales' ? 'sale_date' : 'snapshot_date';
    const tableName = `${tablePrefix}_${type === 'sales' ? 'sales' : 'inventory'}`;

    // Extract unique dates from the CSV
    const dateKey = type === 'sales'
        ? (platform === 'zepto' ? 'Date' : platform === 'swiggy' ? 'ORDERED_DATE' : 'date')
        : (platform === 'zepto' ? 'Date' : platform === 'swiggy' ? 'date' : 'created_at');

    const csvDates = [...new Set(rows.map(row => {
        const rawDate = getColumn(row, dateKey, 'date', 'Date', 'ORDERED_DATE', 'created_at');
        return parseDate(rawDate);
    }).filter(Boolean))];

    if (csvDates.length === 0) {
        return { hasOverlap: false, overlappingDates: [], newDates: [], existingRecordCount: 0 };
    }

    // Check which dates already exist in the database
    const { data: existingData, error } = await supabase
        .from(tableName)
        .select(dateColumn)
        .eq('brand', brand)
        .in(dateColumn, csvDates);

    if (error) {
        console.error('Error checking existing dates:', error);
        return { hasOverlap: false, overlappingDates: [], newDates: csvDates, existingRecordCount: 0 };
    }

    const existingDates = [...new Set(existingData?.map(r => r[dateColumn]) || [])];
    const overlappingDates = csvDates.filter(d => existingDates.includes(d));
    const newDates = csvDates.filter(d => !existingDates.includes(d));

    // Get count of existing records for these dates
    let existingRecordCount = 0;
    if (overlappingDates.length > 0) {
        const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('brand', brand)
            .in(dateColumn, overlappingDates);

        if (!countError) {
            existingRecordCount = count || 0;
        }
    }

    return {
        hasOverlap: overlappingDates.length > 0,
        overlappingDates,
        newDates,
        existingRecordCount,
        totalDatesInCSV: csvDates.length
    };
}

/**
 * Upload sales CSV data to Supabase
 */
export async function uploadSalesData(platform, brand, rows, userId) {
    const tablePrefix = platform === 'swiggy' ? 'instamart' : platform;
    console.log(`📊 uploadSalesData called for ${platform}`);
    console.log('  Brand:', brand);
    console.log('  Total rows from CSV:', rows.length);
    if (rows.length > 0) {
        console.log('  First row keys:', Object.keys(rows[0]));
        console.log('  First row:', rows[0]);
    }

    const records = rows.map((row, idx) => {
        let saleDate, itemId, itemName, cat, cityName, qty, price, variant, gmv;

        if (platform === 'swiggy') {
            // Instamart Specific Mapping
            saleDate = parseDate(getColumn(row, 'ORDERED_DATE', 'date'));
            itemId = getColumn(row, 'ITEM_CODE', 'item_id');
            const productName = getColumn(row, 'PRODUCT_NAME');
            variant = getColumn(row, 'VARIANT');
            itemName = variant ? `${productName} (${variant})` : productName;
            cat = getColumn(row, 'L1_CATEGORY', 'category');
            cityName = getColumn(row, 'CITY', 'city_name');
            qty = parseInt(cleanNum(getColumn(row, 'UNITS_SOLD', 'qty_sold'))) || 0;
            gmv = parseFloat(cleanNum(getColumn(row, 'GMV'))) || 0;
            price = qty > 0 ? gmv / qty : gmv;

            return {
                brand,
                item_id: String(itemId),
                item_name: itemName,
                city_name: cityName,
                category: cat,
                sale_date: saleDate,
                qty_sold: qty,
                mrp: price,
                gmv: gmv,
                variant: variant,
                uploaded_by: userId
            };
        } else if (platform === 'zepto') {
            // Zepto Specific Mapping (Refined to match user spreadsheet)
            saleDate = parseDate(getColumn(row, 'Date', 'date'));
            itemId = getColumn(row, 'SKU Number', 'sku_number', 'item_id');
            itemName = getColumn(row, 'SKU Name', 'sku_name', 'item_name');

            return {
                brand,
                sale_date: saleDate,
                item_id: String(itemId),
                item_name: itemName,
                ean: getColumn(row, 'EAN'),
                sku_category: getColumn(row, 'SKU Category'),
                sku_sub_category: getColumn(row, 'SKU Sub Category', 'SKU Sub Cate'),
                brand_name: getColumn(row, 'Brand Name'),
                manufacturer_name: getColumn(row, 'Manufacturer Name'),
                manufacturer_id: String(getColumn(row, 'Manufacturer ID')),
                city: getColumn(row, 'City'),
                sales_qty: parseInt(cleanNum(getColumn(row, 'Sales (Qty) - Units', 'Sales (Qty)'))) || 0,
                mrp: parseFloat(cleanNum(getColumn(row, 'MRP'))) || 0,
                selling_price: parseFloat(cleanNum(getColumn(row, 'SellingPrice', 'Selling Price'))) || 0,
                gmv: parseFloat(cleanNum(getColumn(row, 'Gross Merchandise Value', 'GMV'))) || 0,
                gross_selling_value: parseFloat(cleanNum(getColumn(row, 'Gross SellingValue', 'Gross Selling Value'))) || 0,
                pack_size: getColumn(row, 'Pack Size'),
                unit_of_measure: getColumn(row, 'Unit of Measure', 'Unit of Meas.'),
                orders: parseInt(cleanNum(getColumn(row, 'Orders'))) || 0,
                uploaded_by: userId
            };
        } else {
            // Default/Blinkit Mapping
            saleDate = parseDate(getColumn(row, 'date', 'Date', 'sale_date'));
            itemId = getColumn(row, 'item_id', 'Item_id', 'Item ID', 'itemid');
            itemName = getColumn(row, 'item_name', 'Item_name', 'Item Name');
            cat = getColumn(row, 'category', 'Category');
            cityName = getColumn(row, 'city_name', 'City_name', 'City Name');
            qty = parseInt(cleanNum(getColumn(row, 'qty_sold', 'Qty_sold', 'quantity'))) || 0;
            price = parseFloat(cleanNum(getColumn(row, 'mrp', 'MRP', 'price'))) || 0;

            return {
                brand,
                item_id: String(itemId),
                item_name: itemName,
                city_name: cityName,
                category: cat,
                sale_date: saleDate,
                qty_sold: qty,
                mrp: price,
                uploaded_by: userId
            };
        }
    }).filter(r => r.sale_date && r.item_id);

    const filteredOutCount = rows.length - records.length;
    console.log('  Records after filtering:', records.length);
    if (filteredOutCount > 0) {
        console.warn(`  ⚠️ Filtered out ${filteredOutCount} rows due to missing Date or SKU Number.`);
    }
    if (records.length > 0) {
        console.log('  First record to insert:', records[0]);
    }

    if (records.length === 0) {
        console.warn('  ⚠️ No records passed filter! Check date and item_id columns.')
        return { inserted: 0, debug: 'No valid records - check column names' };
    }

    // Determine unique constraint columns based on platform
    // Sales: brand + item_id + sale_date + city (city_name for blinkit/instamart, city for zepto)
    const cityColumn = platform === 'zepto' ? 'city' : 'city_name';
    const conflictColumns = `brand,item_id,sale_date,${cityColumn}`;

    console.log(`  📝 Using upsert with conflict on: ${conflictColumns}`);

    // Use upsert to handle duplicates - updates existing records, inserts new ones
    const { data, error } = await supabase
        .from(`${tablePrefix}_sales`)
        .upsert(records, {
            onConflict: conflictColumns,
            ignoreDuplicates: false  // false = update on conflict, true = ignore
        });

    if (error) {
        console.error('  ❌ Supabase upsert error:', error);

        // Fallback: If upsert fails (e.g., no unique constraint), try delete+insert
        if (error.code === '42P10' || error.message?.includes('constraint')) {
            console.log('  🔄 Falling back to delete+insert strategy...');

            const uniqueDates = [...new Set(records.map(r => r.sale_date))];
            const { error: deleteError } = await supabase
                .from(`${tablePrefix}_sales`)
                .delete()
                .eq('brand', brand)
                .in('sale_date', uniqueDates);

            if (deleteError) {
                console.error('  ❌ Supabase delete error:', deleteError);
                throw deleteError;
            }

            const { error: insertError } = await supabase
                .from(`${tablePrefix}_sales`)
                .insert(records);

            if (insertError) {
                console.error('  ❌ Supabase insert error:', insertError);
                throw insertError;
            }
        } else {
            throw error;
        }
    }

    console.log('  ✅ Upserted successfully');
    return { inserted: records.length };
}

/**
 * Upload inventory CSV data to Supabase
 */
export async function uploadInventoryData(platform, brand, rows, userId) {
    const tablePrefix = platform === 'swiggy' ? 'instamart' : platform;
    console.log(`📦 uploadInventoryData called for ${platform}`);
    console.log('  Brand:', brand);
    console.log('  Total rows from CSV:', rows.length);
    if (rows.length > 0) {
        console.log('  First row keys:', Object.keys(rows[0]));
        console.log('  First row:', rows[0]);
    }

    const records = rows.map((row, idx) => {
        let snapshotDate, itemId, itemName, cityName, facilityName, backendInv, frontendInv, cat;
        let city, l2Category, daysOnHand, potentialLoss, openPos, openPoQty, warehouseQty;

        if (platform === 'swiggy') {
            // Instamart Specific Mapping
            snapshotDate = parseDate(getColumn(row, 'date', 'Date', 'created_at')) || new Date().toISOString().split('T')[0];
            itemId = getColumn(row, 'SkuCode', 'item_id');
            itemName = getColumn(row, 'SkuDescription', 'item_name');
            cityName = getColumn(row, 'City');
            facilityName = getColumn(row, 'FacilityName', 'facility_name');
            l2Category = getColumn(row, 'L2');
            daysOnHand = parseFloat(getColumn(row, 'DaysOnHand')) || 0;
            potentialLoss = parseFloat(getColumn(row, 'PotentialGmvLoss')) || 0;
            openPoQty = parseInt(getColumn(row, 'OpenPoQuantity')) || 0;
            warehouseQty = parseInt(getColumn(row, 'WarehouseQtyAvailable')) || 0;

            const openPosRaw = getColumn(row, 'OpenPos');
            if (openPosRaw) {
                try {
                    const cleaned = openPosRaw.replace(/[\[\]]/g, '').split(/[",]+/).map(s => s.trim()).filter(s => s);
                    openPos = cleaned;
                } catch (e) {
                    openPos = [openPosRaw];
                }
            }

            return {
                brand,
                snapshot_date: snapshotDate,
                facility_name: facilityName,
                item_id: String(itemId),
                item_name: itemName,
                backend_inv: warehouseQty,
                frontend_inv: 0,
                city: cityName,
                l2_category: l2Category,
                days_on_hand: daysOnHand,
                potential_loss: potentialLoss,
                open_pos: openPos,
                open_po_qty: openPoQty,
                warehouse_qty: warehouseQty,
                uploaded_by: userId
            };
        } else if (platform === 'zepto') {
            // Zepto Specific Mapping (Refined to match user spreadsheet)
            snapshotDate = parseDate(getColumn(row, 'Date', 'date', 'created_at')) || new Date().toISOString().split('T')[0];
            itemId = getColumn(row, 'SKU Code', 'sku_code', 'item_id');
            itemName = getColumn(row, 'SKU Name', 'sku_name', 'item_name');
            cityName = getColumn(row, 'City', 'city_name');
            backendInv = parseInt(cleanNum(getColumn(row, 'Units', 'units', 'backend_inv'))) || 0;

            return {
                brand,
                snapshot_date: snapshotDate,
                city: cityName,
                item_id: String(itemId),
                item_name: itemName,
                ean: getColumn(row, 'EAN'),
                sku_category: getColumn(row, 'SKU Category', 'category'),
                sku_sub_cate: getColumn(row, 'SKU Sub Cate', 'sub_category'),
                brand_name: getColumn(row, 'Brand Name'),
                manufacture: getColumn(row, 'Manufacture'),
                manufacturer_id: String(getColumn(row, 'Manufacturer ID', 'manufacturer_id')),
                backend_inv: backendInv,
                uploaded_by: userId
            };
        } else {
            // Default/Blinkit Mapping
            snapshotDate = parseDate(getColumn(row, 'created_at', 'Created_at', 'date', 'Date'));
            itemId = getColumn(row, 'item_id', 'Item_id', 'Item ID', 'itemid');
            itemName = getColumn(row, 'item_name', 'Item_name', 'Item Name');
            facilityName = getColumn(row, 'backend_facility_name', 'Backend_facility_name', 'facility_name');
            backendInv = parseInt(cleanNum(getColumn(row, 'backend_inv', 'Backend_inv', 'backend_inventory'))) || 0;
            frontendInv = parseInt(cleanNum(getColumn(row, 'frontend_inv', 'Frontend_inv', 'frontend_inventory'))) || 0;
            cityName = getColumn(row, 'city_name', 'City_name', 'City Name');

            return {
                brand,
                snapshot_date: snapshotDate,
                facility_name: facilityName,
                facility_code: parseInt(getColumn(row, 'backend_fac', 'Backend_fac', 'facility_code')) || null,
                item_id: String(itemId),
                item_name: itemName,
                backend_inv: backendInv,
                frontend_inv: frontendInv,
                city: cityName,
                uploaded_by: userId
            };
        }
    }).filter(r => r.snapshot_date && r.item_id);

    const filteredOutCount = rows.length - records.length;
    console.log('  Records after filtering:', records.length);
    if (filteredOutCount > 0) {
        console.warn(`  ⚠️ Filtered out ${filteredOutCount} inventory rows due to missing Date or SKU Code.`);
    }
    if (records.length > 0) {
        console.log('  First record to insert:', records[0]);
    }

    if (records.length === 0) {
        console.warn('  ⚠️ No records passed filter! Check date and item_id columns.');
        return { inserted: 0, debug: 'No valid records - check column names' };
    }

    // Determine unique constraint columns based on platform
    // Inventory: brand + item_id + snapshot_date + facility/city
    // Zepto uses city, Blinkit/Instamart use facility_name
    const locationColumn = platform === 'zepto' ? 'city' : 'facility_name';
    const conflictColumns = `brand,item_id,snapshot_date,${locationColumn}`;

    console.log(`  📝 Using upsert with conflict on: ${conflictColumns}`);

    // Use upsert to handle duplicates - updates existing records, inserts new ones
    const { data, error } = await supabase
        .from(`${tablePrefix}_inventory`)
        .upsert(records, {
            onConflict: conflictColumns,
            ignoreDuplicates: false  // false = update on conflict, true = ignore
        });

    if (error) {
        console.error('  ❌ Supabase upsert error:', error);

        // Fallback: If upsert fails (e.g., no unique constraint), try delete+insert
        if (error.code === '42P10' || error.message?.includes('constraint')) {
            console.log('  🔄 Falling back to delete+insert strategy...');

            const uniqueDates = [...new Set(records.map(r => r.snapshot_date))];
            const { error: deleteError } = await supabase
                .from(`${tablePrefix}_inventory`)
                .delete()
                .eq('brand', brand)
                .in('snapshot_date', uniqueDates);

            if (deleteError) {
                console.error('  ❌ Supabase delete error:', deleteError);
                throw deleteError;
            }

            const { error: insertError } = await supabase
                .from(`${tablePrefix}_inventory`)
                .insert(records);

            if (insertError) {
                console.error('  ❌ Supabase insert error:', insertError);
                throw insertError;
            }
        } else {
            throw error;
        }
    }

    console.log('  ✅ Upserted successfully');
    return { inserted: records.length };
}

/**
 * Get sales analytics for a brand - with pagination to handle Supabase limits
 */
export async function getSalesAnalytics(platform, brand, days = 60) {
    const tablePrefix = platform === 'swiggy' ? 'instamart' : platform;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log('📊 getSalesAnalytics:', { brand, days, startDate: startDateStr });

    // Use pagination to fetch all data (Supabase has 1000 row default limit)
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from(`${tablePrefix}_sales`)
            .select('*')
            .eq('brand', brand)
            .gte('sale_date', startDateStr)
            .order('sale_date', { ascending: true })
            .range(from, to);

        if (error) {
            console.error('  ❌ Error:', error);
            throw error;
        }

        if (data && data.length > 0) {
            allData = allData.concat(data);
            hasMore = data.length === pageSize; // Keep fetching if we got a full page
            page++;
        } else {
            hasMore = false;
        }
    }

    console.log('  ✅ Fetched total rows:', allData.length);
    if (allData.length > 0) {
        const dates = [...new Set(allData.map(d => d.sale_date))].sort();
        console.log('  📅 Date range:', dates[0], 'to', dates[dates.length - 1]);
    }

    return allData;
}

/**
 * Get latest inventory snapshot for a brand
 */
export async function getLatestInventory(platform, brand) {
    const tablePrefix = platform === 'swiggy' ? 'instamart' : platform;
    // 1. Get the latest date
    const { data: dateData, error: dateError } = await supabase
        .from(`${tablePrefix}_inventory`)
        .select('snapshot_date')
        .eq('brand', brand)
        .order('snapshot_date', { ascending: false })
        .limit(1);

    if (dateError) throw dateError;
    if (!dateData || dateData.length === 0) return [];

    const latestDate = dateData[0].snapshot_date;

    // 2. Get EVERYTHING for that date (using paginated loop)
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from(`${tablePrefix}_inventory`)
            .select('*')
            .eq('brand', brand)
            .eq('snapshot_date', latestDate)
            .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
            allData = allData.concat(data);
            hasMore = data.length === pageSize;
            page++;
        } else {
            hasMore = false;
        }
    }

    return allData;
}

/**
 * Get sales summary by product
 */
export async function getSalesSummaryByProduct(platform, brand, days = 30, preFetchedSales = null) {
    const sales = preFetchedSales || await getSalesAnalytics(platform, brand, days);

    const summary = {};
    sales.forEach(sale => {
        const qtySold = sale.qty_sold || sale.sales_qty || 0;
        const cityName = sale.city_name || sale.city || 'Unknown';

        if (!summary[sale.item_id]) {
            summary[sale.item_id] = {
                item_id: sale.item_id,
                item_name: sale.item_name,
                category: sale.category,
                total_qty: 0,
                total_revenue: 0,
                cities: new Set()
            };
        }
        summary[sale.item_id].total_qty += qtySold;
        summary[sale.item_id].total_revenue += qtySold * (sale.mrp || sale.selling_price || 0);
        summary[sale.item_id].cities.add(cityName);
    });

    return Object.values(summary).map(s => ({
        ...s,
        cities: Array.from(s.cities),
        city_count: s.cities.size
    })).sort((a, b) => b.total_qty - a.total_qty);
}

/**
 * Get sales by city
 */
export async function getSalesByCity(platform, brand, days = 30, preFetchedSales = null) {
    const sales = preFetchedSales || await getSalesAnalytics(platform, brand, days);

    const cityMap = {};
    sales.forEach(sale => {
        const city = sale.city_name || sale.city || 'Unknown';
        const qtySold = sale.qty_sold || sale.sales_qty || 0;

        if (!cityMap[city]) {
            cityMap[city] = { city, total_qty: 0, total_revenue: 0 };
        }
        cityMap[city].total_qty += qtySold;
        cityMap[city].total_revenue += qtySold * (sale.mrp || sale.selling_price || 0);
    });

    return Object.values(cityMap).sort((a, b) => b.total_qty - a.total_qty);
}

/**
 * Calculate stockout risk for products
 * Risk = (Avg Daily Sales × 7) / Current Inventory
 */
export async function calculateStockoutRisk(platform, brand) {
    const [sales, inventory] = await Promise.all([
        getSalesAnalytics(platform, brand, 14),
        getLatestInventory(platform, brand)
    ]);

    // Calculate avg daily sales per product
    const salesByProduct = {};
    sales.forEach(s => {
        if (!salesByProduct[s.item_id]) {
            salesByProduct[s.item_id] = { qty: 0, days: new Set() };
        }
        salesByProduct[s.item_id].qty += s.qty_sold;
        salesByProduct[s.item_id].days.add(s.sale_date);
    });

    // Get latest inventory per product with facility breakdown
    const invByProduct = {};
    inventory.forEach(inv => {
        if (!invByProduct[inv.item_id]) {
            invByProduct[inv.item_id] = {
                item_id: inv.item_id,
                item_name: inv.item_name,
                total_inv: 0,
                backend_inv: 0,
                frontend_inv: 0,
                facilities: {}
            };
        }
        invByProduct[inv.item_id].total_inv += (inv.backend_inv + inv.frontend_inv);
        invByProduct[inv.item_id].backend_inv += inv.backend_inv;
        invByProduct[inv.item_id].frontend_inv += inv.frontend_inv;

        // Track by facility
        const facilityName = inv.facility_name || 'Unknown';
        if (!invByProduct[inv.item_id].facilities[facilityName]) {
            invByProduct[inv.item_id].facilities[facilityName] = 0;
        }
        invByProduct[inv.item_id].facilities[facilityName] += (inv.backend_inv + inv.frontend_inv);
    });

    // Calculate risk scores
    const riskItems = [];
    Object.keys(invByProduct).forEach(itemId => {
        const inv = invByProduct[itemId];
        const salesData = salesByProduct[itemId] || { qty: 0, days: new Set([1]) };
        const avgDailySales = salesData.qty / Math.max(salesData.days.size, 1);
        const weekProjection = avgDailySales * 7;
        const riskScore = inv.total_inv > 0 ? weekProjection / inv.total_inv : 999;

        let riskLevel = 'low';
        if (riskScore >= 1) riskLevel = 'high';
        else if (riskScore >= 0.5) riskLevel = 'medium';

        // Get top facilities
        const facilityList = Object.entries(inv.facilities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, qty]) => ({ name, qty }));

        riskItems.push({
            item_id: itemId,
            item_name: inv.item_name,
            current_inventory: inv.total_inv,
            backend_inv: inv.backend_inv,
            frontend_inv: inv.frontend_inv,
            facility_count: Object.keys(inv.facilities).length,
            top_facilities: facilityList,
            avg_daily_sales: Math.round(avgDailySales * 10) / 10,
            days_of_stock: inv.total_inv > 0 ? Math.round(inv.total_inv / avgDailySales) : 999,
            risk_score: Math.round(riskScore * 100) / 100,
            risk_level: riskLevel
        });
    });

    return riskItems.sort((a, b) => b.risk_score - a.risk_score);
}

/**
 * Get daily sales trend for charting
 */
export async function getDailySalesTrend(platform, brand, days = 30, preFetchedSales = null) {
    const sales = preFetchedSales || await getSalesAnalytics(platform, brand, days);

    const dailyMap = {};
    sales.forEach(s => {
        const date = s.sale_date;
        const qtySold = s.qty_sold || s.sales_qty || 0;

        if (!dailyMap[date]) {
            dailyMap[date] = { date, qty: 0, revenue: 0 };
        }
        dailyMap[date].qty += qtySold;
        dailyMap[date].revenue += qtySold * (s.mrp || s.selling_price || 0);
    });

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get aggregated inventory by facility (feeder house)
 */
export async function getInventoryByFacility(platform, brand) {
    const inventory = await getLatestInventory(platform, brand);

    const facilityMap = {};
    inventory.forEach(inv => {
        // For Zepto, if facility_name is missing, use city as the facility
        const facility = inv.facility_name || inv.city || inv.city_name || 'Unknown';
        if (!facilityMap[facility]) {
            facilityMap[facility] = {
                facility,
                total_inv: 0,
                backend_inv: 0,
                frontend_inv: 0,
                sku_count: new Set(),
                items_map: {}
            };
        }

        const currentTotal = (inv.backend_inv || 0) + (inv.frontend_inv || 0);
        facilityMap[facility].total_inv += currentTotal;
        facilityMap[facility].backend_inv += (inv.backend_inv || 0);
        facilityMap[facility].frontend_inv += (inv.frontend_inv || 0);
        facilityMap[facility].sku_count.add(inv.item_id);

        // Aggregate by item_name to prevent duplicates
        const itemName = inv.item_name || inv.item_id;
        if (!facilityMap[facility].items_map[itemName]) {
            facilityMap[facility].items_map[itemName] = {
                item_name: itemName,
                total_inv: 0,
                backend_inv: 0,
                frontend_inv: 0
            };
        }

        const prod = facilityMap[facility].items_map[itemName];
        prod.total_inv += currentTotal;
        prod.backend_inv += (inv.backend_inv || 0);
        prod.frontend_inv += (inv.frontend_inv || 0);
    });

    return Object.values(facilityMap).map(fac => {
        const productList = Object.values(fac.items_map);
        const sortedItems = productList.sort((a, b) => b.total_inv - a.total_inv);
        return {
            ...fac,
            sku_count: fac.sku_count.size,
            all_products: sortedItems.map(p => p.item_name).join(' ').toLowerCase(),
            inventory_items: sortedItems,
            top_products: sortedItems.slice(0, 5) // Keep top 5 for default view
        };
    }).sort((a, b) => b.total_inv - a.total_inv);
}


/**
 * Get "Nuclear" insights combining sales and inventory for deep business intelligence
 */
export async function getNuclearInsights(platform, brand) {
    console.log(`☢️ getNuclearInsights called for ${platform}:`, brand);

    // Fetch 60 days of sales + latest inventory
    const [sales, inventory] = await Promise.all([
        getSalesAnalytics(platform, brand, 60),
        getLatestInventory(platform, brand)
    ]);

    // 1. Calculate DRR (Daily Run Rate) per product using different windows
    const productStats = {};

    // Get last 7, 14, 30 day markers
    const now = new Date();
    const d7 = new Date(now); d7.setDate(now.getDate() - 7);
    const d14 = new Date(now); d14.setDate(now.getDate() - 14);
    const d30 = new Date(now); d30.setDate(now.getDate() - 30);

    sales.forEach(s => {
        if (!productStats[s.item_id]) {
            productStats[s.item_id] = {
                item_name: s.item_name,
                qty7: 0, qty14: 0, qty30: 0, qty60: 0,
                daysActive: new Set()
            };
        }

        const saleDate = new Date(s.sale_date);
        const qtySold = s.qty_sold || s.sales_qty || 0;
        productStats[s.item_id].qty60 += qtySold;
        productStats[s.item_id].daysActive.add(s.sale_date);

        if (saleDate >= d7) productStats[s.item_id].qty7 += qtySold;
        if (saleDate >= d14) productStats[s.item_id].qty14 += qtySold;
        if (saleDate >= d30) productStats[s.item_id].qty30 += qtySold;
    });

    // 2. Aggregate Inventory
    const invMap = {};
    inventory.forEach(inv => {
        if (!invMap[inv.item_id]) {
            invMap[inv.item_id] = {
                total: 0, backend: 0, frontend: 0,
                facilities: new Set(),
                cityName: inv.city_name || inv.city || 'Generic',
                open_po_qty: 0,
                open_pos: new Set()
            };
        }
        const qty = (inv.backend_inv || 0) + (inv.frontend_inv || 0);
        invMap[inv.item_id].total += qty;
        invMap[inv.item_id].backend += (inv.backend_inv || 0);
        invMap[inv.item_id].frontend += (inv.frontend_inv || 0);
        invMap[inv.item_id].facilities.add(inv.facility_name || inv.city || 'Unknown');

        // Add PO data for Instamart
        if (platform === 'swiggy' || platform === 'instamart') {
            invMap[inv.item_id].open_po_qty += (inv.open_po_qty || 0);
            if (inv.open_pos && Array.isArray(inv.open_pos)) {
                inv.open_pos.forEach(po => invMap[inv.item_id].open_pos.add(po));
            }
        }
    });

    // 3. Combine and generate "Nuclear" items
    const nuclearInsights = Object.keys(invMap).map(itemId => {
        const stats = productStats[itemId] || { qty7: 0, qty14: 0, qty30: 0, qty60: 0, daysActive: new Set() };
        const inv = invMap[itemId];

        // Calculate Weighted DRR (Daily Run Rate) - higher weight for recent velocity
        // (7d_drr * 0.5) + (14d_drr * 0.3) + (30d_drr * 0.2)
        const drr7 = stats.qty7 / 7;
        const drr14 = stats.qty14 / 14;
        const drr30 = stats.qty30 / 30;
        const weightedDRR = (drr7 * 0.6) + (drr14 * 0.3) + (drr30 * 0.1);

        // DOH (Days On Hand)
        const doh = weightedDRR > 0 ? inv.total / weightedDRR : (inv.total > 0 ? 999 : 0);

        // Stockout Forecast
        const forecastedStockoutDate = weightedDRR > 0
            ? new Date(now.getTime() + (doh * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
            : null;

        // Opportunity Loss (if stockout happens or already OOS)
        // Assume next 30 days loss if it stocks out within 7 days
        let opportunityLoss = 0;
        if (doh < 7) {
            const lostUnits = Math.max(0, (7 - doh) * weightedDRR);
            opportunityLoss = lostUnits * 1.5; // Estimated factor (e.g. price)
        }

        return {
            item_id: itemId,
            item_name: stats.item_name || inventory.find(i => i.item_id === itemId)?.item_name || itemId,
            drr: Math.round(weightedDRR * 10) / 10,
            current_inv: inv.total,
            backend_inv: inv.backend,
            frontend_inv: inv.frontend,
            doh: Math.round(doh),
            forecasted_date: forecastedStockoutDate,
            facility_count: inv.facilities.size,
            opportunity_loss: Math.round(opportunityLoss),
            status: doh < 7 ? 'Critical' : (doh < 21 ? 'Watch' : 'Healthy'),
            // PO fields for Instamart
            open_po_qty: inv.open_po_qty || 0,
            open_pos: Array.from(inv.open_pos || [])
        };
    });

    // 4. Global KPIs
    const criticalItems = nuclearInsights.filter(i => i.status === 'Critical').length;
    const avgDOH = nuclearInsights.reduce((sum, i) => sum + i.doh, 0) / (nuclearInsights.length || 1);
    const totalPotentialLoss = nuclearInsights.reduce((sum, i) => sum + i.opportunity_loss, 0);

    return {
        items: nuclearInsights.sort((a, b) => a.doh - b.doh),
        kpis: {
            criticalItems,
            avgDOH: Math.round(avgDOH),
            totalPotentialLoss: Math.round(totalPotentialLoss)
        }
    };
}
/**
 * Get everything in one go - THE NUCLEAR OPTION
 */
export async function getCompleteAnalytics(platform, brand) {
    console.log(`🌪️ getCompleteAnalytics called for ${platform}:`, brand);

    // Process all metrics
    const [summary, cities, risk, trend, facilities, nuclear] = await Promise.all([
        getSalesSummaryByProduct(platform, brand, 60),
        getSalesByCity(platform, brand, 60),
        calculateStockoutRisk(platform, brand),
        getDailySalesTrend(platform, brand, 60),
        getInventoryByFacility(platform, brand),
        getNuclearInsights(platform, brand)
    ]);

    return { summary, cities, risk, trend, facilities, nuclear };
}
