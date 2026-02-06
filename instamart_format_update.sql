-- Add specialized fields for Instamart Analytics
-- Run this in your Supabase SQL Editor

-- 1. Update instamart_sales table
ALTER TABLE instamart_sales 
ADD COLUMN IF NOT EXISTS variant TEXT,
ADD COLUMN IF NOT EXISTS gmv NUMERIC;

COMMENT ON COLUMN instamart_sales.variant IS 'Instamart specific product variant';
COMMENT ON COLUMN instamart_sales.gmv IS 'Gross Merchandise Value from Instamart report';

-- 2. Update instamart_inventory table
ALTER TABLE instamart_inventory
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS l2_category TEXT,
ADD COLUMN IF NOT EXISTS days_on_hand NUMERIC,
ADD COLUMN IF NOT EXISTS potential_loss NUMERIC,
ADD COLUMN IF NOT EXISTS open_pos TEXT[],
ADD COLUMN IF NOT EXISTS open_po_qty NUMERIC,
ADD COLUMN IF NOT EXISTS warehouse_qty NUMERIC;

COMMENT ON COLUMN instamart_inventory.city IS 'City name from Instamart inventory report';
COMMENT ON COLUMN instamart_inventory.l2_category IS 'L2 Category from Instamart inventory report';
COMMENT ON COLUMN instamart_inventory.days_on_hand IS 'Days on Hand metric';
COMMENT ON COLUMN instamart_inventory.potential_loss IS 'Potential GMV Loss due to stockout';
COMMENT ON COLUMN instamart_inventory.open_pos IS 'List of Open PO numbers';
COMMENT ON COLUMN instamart_inventory.open_po_qty IS 'Total quantity in open POs';
COMMENT ON COLUMN instamart_inventory.warehouse_qty IS 'Available quantity in warehouse';
