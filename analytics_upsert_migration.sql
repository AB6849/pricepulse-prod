-- ===========================================
-- ANALYTICS UPSERT MIGRATION
-- Adds unique constraints for proper upsert handling
-- Run this in Supabase SQL Editor
-- ===========================================

-- ============================================
-- STEP 1: CLEAN UP EXISTING DUPLICATES
-- Keep only the most recent entry for each unique combination
-- ============================================

-- Clean Blinkit Sales Duplicates
DELETE FROM blinkit_sales a
USING blinkit_sales b
WHERE a.id < b.id
  AND a.brand = b.brand
  AND a.item_id = b.item_id
  AND a.sale_date = b.sale_date
  AND COALESCE(a.city_name, '') = COALESCE(b.city_name, '');

-- Clean Blinkit Inventory Duplicates
DELETE FROM blinkit_inventory a
USING blinkit_inventory b
WHERE a.id < b.id
  AND a.brand = b.brand
  AND a.item_id = b.item_id
  AND a.snapshot_date = b.snapshot_date
  AND COALESCE(a.facility_name, '') = COALESCE(b.facility_name, '');

-- Clean Zepto Sales Duplicates
DELETE FROM zepto_sales a
USING zepto_sales b
WHERE a.id < b.id
  AND a.brand = b.brand
  AND a.item_id = b.item_id
  AND a.sale_date = b.sale_date
  AND COALESCE(a.city, '') = COALESCE(b.city, '');

-- Clean Zepto Inventory Duplicates
DELETE FROM zepto_inventory a
USING zepto_inventory b
WHERE a.id < b.id
  AND a.brand = b.brand
  AND a.item_id = b.item_id
  AND a.snapshot_date = b.snapshot_date
  AND COALESCE(a.city, '') = COALESCE(b.city, '');

-- Clean Instamart Sales Duplicates
DELETE FROM instamart_sales a
USING instamart_sales b
WHERE a.id < b.id
  AND a.brand = b.brand
  AND a.item_id = b.item_id
  AND a.sale_date = b.sale_date
  AND COALESCE(a.city_name, '') = COALESCE(b.city_name, '');

-- Clean Instamart Inventory Duplicates
DELETE FROM instamart_inventory a
USING instamart_inventory b
WHERE a.id < b.id
  AND a.brand = b.brand
  AND a.item_id = b.item_id
  AND a.snapshot_date = b.snapshot_date
  AND COALESCE(a.facility_name, '') = COALESCE(b.facility_name, '');

-- ============================================
-- STEP 2: DROP EXISTING CONSTRAINTS (if they exist)
-- ============================================

ALTER TABLE blinkit_sales DROP CONSTRAINT IF EXISTS blinkit_sales_unique_constraint;
ALTER TABLE blinkit_inventory DROP CONSTRAINT IF EXISTS blinkit_inventory_unique_constraint;
ALTER TABLE zepto_sales DROP CONSTRAINT IF EXISTS zepto_sales_unique_constraint;
ALTER TABLE zepto_inventory DROP CONSTRAINT IF EXISTS zepto_inventory_unique_constraint;
ALTER TABLE instamart_sales DROP CONSTRAINT IF EXISTS instamart_sales_unique_constraint;
ALTER TABLE instamart_inventory DROP CONSTRAINT IF EXISTS instamart_inventory_unique_constraint;

-- ============================================
-- STEP 3: ADD UNIQUE CONSTRAINTS
-- ============================================

-- BLINKIT
ALTER TABLE blinkit_sales 
ADD CONSTRAINT blinkit_sales_unique_constraint 
UNIQUE (brand, item_id, sale_date, city_name);

ALTER TABLE blinkit_inventory 
ADD CONSTRAINT blinkit_inventory_unique_constraint 
UNIQUE (brand, item_id, snapshot_date, facility_name);

GRANT UPDATE ON blinkit_sales TO authenticated;
GRANT UPDATE ON blinkit_inventory TO authenticated;

-- ZEPTO
ALTER TABLE zepto_sales 
ADD CONSTRAINT zepto_sales_unique_constraint 
UNIQUE (brand, item_id, sale_date, city);

ALTER TABLE zepto_inventory 
ADD CONSTRAINT zepto_inventory_unique_constraint 
UNIQUE (brand, item_id, snapshot_date, city);

GRANT UPDATE ON zepto_sales TO authenticated;
GRANT UPDATE ON zepto_inventory TO authenticated;

-- INSTAMART
ALTER TABLE instamart_sales 
ADD CONSTRAINT instamart_sales_unique_constraint 
UNIQUE (brand, item_id, sale_date, city_name);

ALTER TABLE instamart_inventory 
ADD CONSTRAINT instamart_inventory_unique_constraint 
UNIQUE (brand, item_id, snapshot_date, facility_name);

GRANT UPDATE ON instamart_sales TO authenticated;
GRANT UPDATE ON instamart_inventory TO authenticated;

-- ============================================
-- STEP 4: ADD DELETE POLICIES FOR FALLBACK LOGIC
-- ============================================

-- Blinkit
DROP POLICY IF EXISTS "Users delete their brand sales" ON blinkit_sales;
CREATE POLICY "Users delete their brand sales" ON blinkit_sales
  FOR DELETE USING (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users delete their brand inventory" ON blinkit_inventory;
CREATE POLICY "Users delete their brand inventory" ON blinkit_inventory
  FOR DELETE USING (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

-- Zepto
DROP POLICY IF EXISTS "Users delete their brand sales" ON zepto_sales;
CREATE POLICY "Users delete their brand sales" ON zepto_sales
  FOR DELETE USING (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users delete their brand inventory" ON zepto_inventory;
CREATE POLICY "Users delete their brand inventory" ON zepto_inventory
  FOR DELETE USING (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

-- Instamart
DROP POLICY IF EXISTS "Users delete their brand sales" ON instamart_sales;
CREATE POLICY "Users delete their brand sales" ON instamart_sales
  FOR DELETE USING (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users delete their brand inventory" ON instamart_inventory;
CREATE POLICY "Users delete their brand inventory" ON instamart_inventory
  FOR DELETE USING (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

GRANT DELETE ON blinkit_sales TO authenticated;
GRANT DELETE ON blinkit_inventory TO authenticated;
GRANT DELETE ON zepto_sales TO authenticated;
GRANT DELETE ON zepto_inventory TO authenticated;
GRANT DELETE ON instamart_sales TO authenticated;
GRANT DELETE ON instamart_inventory TO authenticated;

-- ============================================
-- DONE! Duplicates cleaned and constraints added.
-- ============================================
