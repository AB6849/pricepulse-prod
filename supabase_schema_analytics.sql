-- ===========================================
-- BLINKIT SALES & INVENTORY ANALYTICS SCHEMA
-- Run this in Supabase SQL Editor
-- ===========================================

-- 1. SALES TABLE
CREATE TABLE IF NOT EXISTS blinkit_sales (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT,
  manufacturer_id TEXT,
  city_id INTEGER,
  city_name TEXT,
  category TEXT,
  sale_date DATE NOT NULL,
  qty_sold INTEGER DEFAULT 0,
  mrp NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_blinkit_sales_brand_date ON blinkit_sales(brand, sale_date);
CREATE INDEX IF NOT EXISTS idx_blinkit_sales_item ON blinkit_sales(item_id);

-- 2. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS blinkit_inventory (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  facility_name TEXT,
  facility_code INTEGER,
  item_id TEXT NOT NULL,
  item_name TEXT,
  backend_inv INTEGER DEFAULT 0,
  frontend_inv INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_blinkit_inventory_brand_date ON blinkit_inventory(brand, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_blinkit_inventory_item ON blinkit_inventory(item_id);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE blinkit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE blinkit_inventory ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES: Users can see and insert their brand's data
-- For Sales
CREATE POLICY "Users see their brand sales" ON blinkit_sales
  FOR SELECT USING (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert their brand sales" ON blinkit_sales
  FOR INSERT WITH CHECK (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

-- For Inventory
CREATE POLICY "Users see their brand inventory" ON blinkit_inventory
  FOR SELECT USING (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert their brand inventory" ON blinkit_inventory
  FOR INSERT WITH CHECK (
    brand IN (SELECT brand FROM user_brands WHERE user_id = auth.uid())
  );

-- 5. GRANT PERMISSIONS
GRANT SELECT, INSERT ON blinkit_sales TO authenticated;
GRANT SELECT, INSERT ON blinkit_inventory TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE blinkit_sales_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE blinkit_inventory_id_seq TO authenticated;
