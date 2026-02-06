-- Migration: Expand ONLY ZEPTO Analytics Tables with missing fields
-- Run this in Supabase SQL Editor

-- 1. ZEPTO SALES
-- This ensures the table exists with the correct structure from the screenshot
CREATE TABLE IF NOT EXISTS zepto_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    sale_date DATE NOT NULL,
    item_id TEXT NOT NULL, -- SKU Number
    item_name TEXT,        -- SKU Name
    ean TEXT,
    sku_category TEXT,
    sku_sub_category TEXT,
    brand_name TEXT,
    manufacturer_name TEXT,
    manufacturer_id TEXT,
    city TEXT,
    sales_qty INTEGER DEFAULT 0, -- Sales (Qty) - Units
    mrp DECIMAL(10,2),
    selling_price DECIMAL(10,2), -- SellingPrice
    gmv DECIMAL(10,2),           -- Gross Merchandise Value
    gross_selling_value DECIMAL(10,2), -- Gross SellingValue
    pack_size TEXT,
    unit_of_measure TEXT,
    orders INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist if the table was already created
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS ean TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS sku_category TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS sku_sub_category TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS manufacturer_name TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS manufacturer_id TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS sales_qty INTEGER DEFAULT 0;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS mrp DECIMAL(10,2);
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2);
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS gmv DECIMAL(10,2);
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS gross_selling_value DECIMAL(10,2);
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS pack_size TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS unit_of_measure TEXT;
ALTER TABLE zepto_sales ADD COLUMN IF NOT EXISTS orders INTEGER DEFAULT 0;

-- Cleanup Zepto Sales: Drop unused columns
ALTER TABLE zepto_sales DROP COLUMN IF EXISTS variant;
ALTER TABLE zepto_sales DROP COLUMN IF EXISTS manufacturer;
ALTER TABLE zepto_sales DROP COLUMN IF EXISTS qty_sold;
ALTER TABLE zepto_sales DROP COLUMN IF EXISTS sku_sub_cate; -- Replaced by sku_sub_category
ALTER TABLE zepto_sales DROP COLUMN IF EXISTS manufacture;
ALTER TABLE zepto_sales DROP COLUMN IF EXISTS gross_selling_price; -- Replaced by gross_selling_value

-- 2. ZEPTO INVENTORY (Refined to match user spreadsheet)
-- This ensures the table exists with the correct structure from the screenshot
CREATE TABLE IF NOT EXISTS zepto_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    snapshot_date DATE NOT NULL,
    city TEXT,
    item_id TEXT NOT NULL, -- SKU Code
    item_name TEXT,        -- SKU Name
    ean TEXT,
    sku_category TEXT,
    sku_sub_cate TEXT,
    brand_name TEXT,
    manufacture TEXT,
    manufacturer_id TEXT,
    backend_inv INTEGER DEFAULT 0, -- Units
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist if the table was already created
ALTER TABLE zepto_inventory ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE zepto_inventory ADD COLUMN IF NOT EXISTS ean TEXT;
ALTER TABLE zepto_inventory ADD COLUMN IF NOT EXISTS sku_category TEXT;
ALTER TABLE zepto_inventory ADD COLUMN IF NOT EXISTS sku_sub_cate TEXT;
ALTER TABLE zepto_inventory ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE zepto_inventory ADD COLUMN IF NOT EXISTS manufacture TEXT;
ALTER TABLE zepto_inventory ADD COLUMN IF NOT EXISTS manufacturer_id TEXT;
ALTER TABLE zepto_inventory ADD COLUMN IF NOT EXISTS backend_inv INTEGER DEFAULT 0;

-- Cleanup: Remove columns not present in the new Zepto format
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS facility_name;
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS facility_code;
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS frontend_inv;
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS l2_category;
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS days_on_hand;
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS potential_loss;
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS open_pos;
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS open_po_qty;
ALTER TABLE zepto_inventory DROP COLUMN IF EXISTS warehouse_qty;
