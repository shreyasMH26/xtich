-- =============================================================================
-- XTICH Production Database Schema
-- Run this ONCE in your Supabase project SQL Editor.
-- https://app.supabase.com → SQL Editor → New Query → Paste → Run
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";


-- ---------------------------------------------------------------------------
-- SUBSCRIBERS
-- Email captures from the hero allocation bar.
-- ---------------------------------------------------------------------------
create table if not exists subscribers (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null unique,
  source      text        not null default 'hero_allocation_bar',
  created_at  timestamptz not null default now()
);

create index if not exists subscribers_created_at_idx on subscribers (created_at desc);

-- RLS: enabled — server uses service_role key which bypasses all policies.
-- No public access to customer emails.
alter table subscribers enable row level security;


-- ---------------------------------------------------------------------------
-- BESPOKE COMMISSIONS
-- Custom hoodie orders submitted through the Bespoke Atelier form.
-- ---------------------------------------------------------------------------
create table if not exists bespoke_commissions (
  id                  uuid        primary key default gen_random_uuid(),
  reference           text        not null unique,  -- e.g. XT-2026-AB3K7
  email               text        not null,
  name                text        not null,
  hoodie_color        text        not null default 'Obsidian',
  hoodie_color_code   text        not null default '01 / OBSIDIAN',
  hoodie_color_hex    text        not null default '#0A0A0A',
  embroidery_type     text        not null default 'TEXT',
  embroidery_text     text        not null default 'XTICH',
  placement           text        not null default 'CHEST',
  scale               text        not null default 'SMALL',
  thread              text        not null default 'WHITE',
  size                text        not null default 'M',
  quantity            integer     not null default 1 check (quantity > 0 and quantity <= 100),
  custom_instructions text,
  status              text        not null default 'pending'
                        check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists bespoke_commissions_email_idx    on bespoke_commissions (email);
create index if not exists bespoke_commissions_status_idx   on bespoke_commissions (status);
create index if not exists bespoke_commissions_created_idx  on bespoke_commissions (created_at desc);

alter table bespoke_commissions enable row level security;

-- Auto-update updated_at on row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bespoke_commissions_updated_at on bespoke_commissions;
create trigger bespoke_commissions_updated_at
  before update on bespoke_commissions
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------------
-- COMMISSION ASSETS
-- File upload metadata — the actual file lives in Supabase Storage.
-- ---------------------------------------------------------------------------
create table if not exists commission_assets (
  id                uuid        primary key default gen_random_uuid(),
  commission_id     uuid        not null references bespoke_commissions (id) on delete cascade,
  storage_path      text        not null,   -- path inside the bespoke-assets bucket
  original_filename text        not null,
  mime_type         text        not null,
  file_size         bigint      not null check (file_size > 0),
  created_at        timestamptz not null default now()
);

create index if not exists commission_assets_commission_idx on commission_assets (commission_id);

alter table commission_assets enable row level security;


-- ---------------------------------------------------------------------------
-- PRODUCTS
-- Future product catalog — schema foundation only, not yet used.
-- ---------------------------------------------------------------------------
create table if not exists products (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  currency    text        not null default 'INR',
  status      text        not null default 'draft'
                check (status in ('draft', 'active', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_status_idx on products (status);
create index if not exists products_slug_idx   on products (slug);

alter table products enable row level security;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------------
-- ORDERS
-- Future order records — schema foundation only, not yet used.
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id              uuid        primary key default gen_random_uuid(),
  order_reference text        not null unique,
  email           text        not null,
  status          text        not null default 'pending'
                    check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal        numeric(10,2) not null check (subtotal >= 0),
  total           numeric(10,2) not null check (total >= 0),
  currency        text        not null default 'INR',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_email_idx   on orders (email);
create index if not exists orders_status_idx  on orders (status);

alter table orders enable row level security;

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------------
-- ORDER ITEMS
-- Line items for each order.
-- ---------------------------------------------------------------------------
create table if not exists order_items (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        not null references orders (id) on delete cascade,
  product_id  uuid        references products (id) on delete set null,
  quantity    integer     not null default 1 check (quantity > 0),
  size        text,
  variant     text,
  unit_price  numeric(10,2) not null check (unit_price >= 0)
);

create index if not exists order_items_order_idx on order_items (order_id);

alter table order_items enable row level security;


-- ---------------------------------------------------------------------------
-- SITE EVENTS
-- Lightweight analytics / audit log. JSONB metadata for flexibility.
-- ---------------------------------------------------------------------------
create table if not exists site_events (
  id          uuid        primary key default gen_random_uuid(),
  event_type  text        not null,  -- e.g. 'subscriber.new', 'commission.submitted'
  email       text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists site_events_event_type_idx on site_events (event_type);
create index if not exists site_events_email_idx      on site_events (email);
create index if not exists site_events_created_idx    on site_events (created_at desc);
create index if not exists site_events_metadata_idx   on site_events using gin (metadata);

alter table site_events enable row level security;
