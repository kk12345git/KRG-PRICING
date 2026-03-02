-- ============================================================
-- KRG Medifabb Smart Pricing & Pack Builder — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================
-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    description text,
    created_at timestamptz default now()
);
-- ============================================================
-- ITEMS
-- ============================================================
create table if not exists items (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    sku text unique,
    category_id uuid references categories(id) on delete
    set null,
        purchase_price numeric(12, 2) not null default 0,
        selling_price numeric(12, 2) not null default 0,
        gst_percent numeric(5, 2) not null default 12,
        margin_percent numeric(6, 2) generated always as (
            case
                when selling_price > 0 then (
                    (selling_price - purchase_price) / selling_price * 100
                )
                else 0
            end
        ) stored,
        vendor text,
        status text not null default 'active' check (status in ('active', 'inactive')),
        created_at timestamptz default now()
);
-- ============================================================
-- PACKS
-- ============================================================
create table if not exists packs (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    total_cost numeric(14, 2) not null default 0,
    total_selling_price numeric(14, 2) not null default 0,
    margin_percent numeric(6, 2) generated always as (
        case
            when total_selling_price > 0 then (
                (total_selling_price - total_cost) / total_selling_price * 100
            )
            else 0
        end
    ) stored,
    created_at timestamptz default now()
);
-- ============================================================
-- PACK ITEMS
-- ============================================================
create table if not exists pack_items (
    id uuid primary key default uuid_generate_v4(),
    pack_id uuid references packs(id) on delete cascade,
    item_id uuid references items(id) on delete cascade,
    quantity integer not null default 1,
    unique(pack_id, item_id)
);
-- ============================================================
-- HOSPITALS
-- ============================================================
create table if not exists hospitals (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    address text,
    contact_person text,
    phone text,
    pricing_type text not null default 'standard' check (pricing_type in ('standard', 'custom')),
    credit_period integer default 30,
    created_at timestamptz default now()
);
-- ============================================================
-- HOSPITAL PRICING
-- ============================================================
create table if not exists hospital_pricing (
    id uuid primary key default uuid_generate_v4(),
    hospital_id uuid references hospitals(id) on delete cascade,
    item_id uuid references items(id) on delete cascade,
    pack_id uuid references packs(id) on delete cascade,
    custom_price numeric(12, 2) not null default 0,
    discount_percent numeric(5, 2) not null default 0,
    created_at timestamptz default now()
);
-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text not null,
    role text not null default 'sales' check (role in ('admin', 'sales', 'accountant')),
    created_at timestamptz default now()
);
-- Auto-create profile on signup
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.user_profiles (id, email, full_name, role)
values (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        coalesce(new.raw_user_meta_data->>'role', 'sales')
    );
return new;
end;
$$ language plpgsql security definer;
create or replace trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();
-- ============================================================
-- QUOTATIONS
-- ============================================================
create table if not exists quotations (
    id uuid primary key default uuid_generate_v4(),
    hospital_id uuid references hospitals(id) on delete
    set null,
        created_by uuid references auth.users(id),
        status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
        subtotal numeric(14, 2) not null default 0,
        gst_total numeric(14, 2) not null default 0,
        grand_total numeric(14, 2) not null default 0,
        notes text,
        created_at timestamptz default now()
);
-- ============================================================
-- QUOTATION ITEMS
-- ============================================================
create table if not exists quotation_items (
    id uuid primary key default uuid_generate_v4(),
    quotation_id uuid references quotations(id) on delete cascade,
    item_id uuid references items(id) on delete
    set null,
        pack_id uuid references packs(id) on delete
    set null,
        quantity integer not null default 1,
        unit_price numeric(12, 2) not null default 0,
        gst_percent numeric(5, 2) not null default 0,
        total_price numeric(14, 2) not null default 0
);
-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table categories enable row level security;
alter table items enable row level security;
alter table packs enable row level security;
alter table pack_items enable row level security;
alter table hospitals enable row level security;
alter table hospital_pricing enable row level security;
alter table user_profiles enable row level security;
alter table quotations enable row level security;
alter table quotation_items enable row level security;
-- Allow authenticated users to read everything
create policy "Authenticated read categories" on categories for
select using (auth.role() = 'authenticated');
create policy "Authenticated read items" on items for
select using (auth.role() = 'authenticated');
create policy "Authenticated read packs" on packs for
select using (auth.role() = 'authenticated');
create policy "Authenticated read pack_items" on pack_items for
select using (auth.role() = 'authenticated');
create policy "Authenticated read hospitals" on hospitals for
select using (auth.role() = 'authenticated');
create policy "Authenticated read hospital_pricing" on hospital_pricing for
select using (auth.role() = 'authenticated');
create policy "Authenticated read user_profiles" on user_profiles for
select using (auth.role() = 'authenticated');
create policy "Authenticated read quotations" on quotations for
select using (auth.role() = 'authenticated');
create policy "Authenticated read quotation_items" on quotation_items for
select using (auth.role() = 'authenticated');
-- Allow authenticated users to insert/update/delete (app enforces role in UI)
create policy "Authenticated write categories" on categories for all using (auth.role() = 'authenticated');
create policy "Authenticated write items" on items for all using (auth.role() = 'authenticated');
create policy "Authenticated write packs" on packs for all using (auth.role() = 'authenticated');
create policy "Authenticated write pack_items" on pack_items for all using (auth.role() = 'authenticated');
create policy "Authenticated write hospitals" on hospitals for all using (auth.role() = 'authenticated');
create policy "Authenticated write hospital_pricing" on hospital_pricing for all using (auth.role() = 'authenticated');
create policy "Authenticated write user_profiles" on user_profiles for all using (auth.role() = 'authenticated');
create policy "Authenticated write quotations" on quotations for all using (auth.role() = 'authenticated');
create policy "Authenticated write quotation_items" on quotation_items for all using (auth.role() = 'authenticated');
-- ============================================================
-- SEED DATA
-- ============================================================
insert into categories (name, description)
values ('Gloves', 'Surgical and examination gloves'),
    ('Syringes', 'Disposable syringes and needles'),
    ('Drapes', 'Surgical drapes and covers'),
    ('Surgical Kits', 'Pre-packaged surgical kits'),
    ('Sutures', 'Surgical sutures and staples'),
    (
        'IV Accessories',
        'IV sets, cannulas and accessories'
    ) on conflict (name) do nothing;