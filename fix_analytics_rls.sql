-- FIX: RLS Policies with Super Admin Bypass
-- Run this in your Supabase SQL Editor

-- 1. INSTAMART SALES
DROP POLICY IF EXISTS "Users see their brand instamart sales" ON instamart_sales;
CREATE POLICY "Users see their brand instamart sales" ON instamart_sales
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'super_admin' OR
    brand IN (SELECT brand_slug FROM brands WHERE brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid()))
  );
CREATE POLICY "Users insert their brand instamart sales" ON instamart_sales FOR INSERT WITH CHECK (true);

-- 2. INSTAMART INVENTORY
DROP POLICY IF EXISTS "Users see their brand instamart inventory" ON instamart_inventory;
CREATE POLICY "Users see their brand instamart inventory" ON instamart_inventory
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'super_admin' OR
    brand IN (SELECT brand_slug FROM brands WHERE brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid()))
  );
CREATE POLICY "Users insert their brand instamart inventory" ON instamart_inventory FOR INSERT WITH CHECK (true);

-- 3. ZEPTO SALES
DROP POLICY IF EXISTS "Users see their brand zepto sales" ON zepto_sales;
CREATE POLICY "Users see their brand zepto sales" ON zepto_sales
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'super_admin' OR
    brand IN (SELECT brand_slug FROM brands WHERE brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid()))
  );
CREATE POLICY "Users insert their brand zepto sales" ON zepto_sales FOR INSERT WITH CHECK (true);

-- 4. ZEPTO INVENTORY
DROP POLICY IF EXISTS "Users see their brand zepto inventory" ON zepto_inventory;
CREATE POLICY "Users see their brand zepto inventory" ON zepto_inventory
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'super_admin' OR
    brand IN (SELECT brand_slug FROM brands WHERE brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid()))
  );
CREATE POLICY "Users insert their brand zepto inventory" ON zepto_inventory FOR INSERT WITH CHECK (true);
