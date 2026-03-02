-- ============================================================
-- KRG Medifabb — UPDATED RLS Policies (Modern Supabase syntax)
-- auth.role() is deprecated — use (select auth.uid()) is not null
-- Run this in Supabase SQL Editor
-- ============================================================
-- Drop old policies
drop policy if exists "Authenticated read categories" on categories;
drop policy if exists "Authenticated read items" on items;
drop policy if exists "Authenticated read packs" on packs;
drop policy if exists "Authenticated read pack_items" on pack_items;
drop policy if exists "Authenticated read hospitals" on hospitals;
drop policy if exists "Authenticated read hospital_pricing" on hospital_pricing;
drop policy if exists "Authenticated read user_profiles" on user_profiles;
drop policy if exists "Authenticated read quotations" on quotations;
drop policy if exists "Authenticated read quotation_items" on quotation_items;
drop policy if exists "Authenticated write categories" on categories;
drop policy if exists "Authenticated write items" on items;
drop policy if exists "Authenticated write packs" on packs;
drop policy if exists "Authenticated write pack_items" on pack_items;
drop policy if exists "Authenticated write hospitals" on hospitals;
drop policy if exists "Authenticated write hospital_pricing" on hospital_pricing;
drop policy if exists "Authenticated write user_profiles" on user_profiles;
drop policy if exists "Authenticated write quotations" on quotations;
drop policy if exists "Authenticated write quotation_items" on quotation_items;
-- ✅ New policies using modern Supabase syntax
create policy "Allow authenticated read categories" on categories for all using (
    (
        select auth.uid()
    ) is not null
);
create policy "Allow authenticated read items" on items for all using (
    (
        select auth.uid()
    ) is not null
);
create policy "Allow authenticated read packs" on packs for all using (
    (
        select auth.uid()
    ) is not null
);
create policy "Allow authenticated read pack_items" on pack_items for all using (
    (
        select auth.uid()
    ) is not null
);
create policy "Allow authenticated read hospitals" on hospitals for all using (
    (
        select auth.uid()
    ) is not null
);
create policy "Allow authenticated read hosp_pricing" on hospital_pricing for all using (
    (
        select auth.uid()
    ) is not null
);
create policy "Allow authenticated read user_profiles" on user_profiles for all using (
    (
        select auth.uid()
    ) is not null
);
create policy "Allow authenticated read quotations" on quotations for all using (
    (
        select auth.uid()
    ) is not null
);
create policy "Allow authenticated read quot_items" on quotation_items for all using (
    (
        select auth.uid()
    ) is not null
);