-- ==============================================================================
-- ELOQUENCE '26 SUPABASE DATABASE COMPLETE LIVE SCHEMA & MIGRATION SCRIPT
-- Project: https://dfdugnahbtazkgdkqebs.supabase.co
-- Copy & Paste this entire script into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dfdugnahbtazkgdkqebs/sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. EVENTS TABLE & COLUMNS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    number TEXT,
    name TEXT NOT NULL,
    alias TEXT,
    subtitle TEXT,
    category TEXT NOT NULL,
    team_size TEXT,
    min_members INT DEFAULT 1,
    max_members INT DEFAULT 1,
    fee TEXT,
    fee_per_head NUMERIC DEFAULT 0,
    fee_type TEXT DEFAULT 'per_head',
    is_team BOOLEAN DEFAULT false,
    tag TEXT,
    venue TEXT,
    venue_image TEXT,
    timing TEXT,
    description TEXT,
    image TEXT,
    rules JSONB DEFAULT '[]'::jsonb,
    rounds JSONB DEFAULT '[]'::jsonb,
    guidelines JSONB DEFAULT '[]'::jsonb,
    highlights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ALTER COLUMN fee TYPE TEXT USING fee::text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee_per_head NUMERIC DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee_type TEXT DEFAULT 'per_head';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS min_members INT DEFAULT 1;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_members INT DEFAULT 1;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_image TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS rounds JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS guidelines JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- 2. REGISTRATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT UNIQUE NOT NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college TEXT,
    department TEXT,
    year TEXT,
    team_name TEXT,
    members_count INT DEFAULT 1,
    total_fee NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'PENDING',
    registration_status TEXT DEFAULT 'CONFIRMED',
    payment_method TEXT DEFAULT 'ONLINE',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    venue_snapshot TEXT,
    timing_snapshot TEXT,
    is_verified BOOLEAN DEFAULT false,
    attendance_status TEXT DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'ONLINE';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'pending';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS upi_utr TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS flagged_by TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_screenshot_path TEXT;

-- ------------------------------------------------------------------------------
-- 3. REGISTRATION MEMBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registration_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    ticket_code TEXT,
    member_number INT DEFAULT 2,
    member_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    college TEXT,
    department TEXT,
    year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.registration_members ADD COLUMN IF NOT EXISTS ticket_code TEXT;
ALTER TABLE public.registration_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.registration_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.registration_members ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.registration_members ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.registration_members ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE public.registration_members DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4. COORDINATORS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coordinators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    department TEXT,
    year TEXT,
    role TEXT,
    assigned_events JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 999,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coordinators ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.coordinators ADD COLUMN IF NOT EXISTS assigned_events JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.coordinators ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.coordinators ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 999;
ALTER TABLE public.coordinators ADD COLUMN IF NOT EXISTS game TEXT;

-- ------------------------------------------------------------------------------
-- 5. SPONSORS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    logo TEXT,
    description TEXT,
    website TEXT,
    location_url TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    category TEXT,
    display_order INT DEFAULT 999,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS location_url TEXT;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 999;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ------------------------------------------------------------------------------
-- 6. USERS TABLE (Admin, Lead Coordinators & Staff Accounts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    assigned_events JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS assigned_events JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ------------------------------------------------------------------------------
-- 7. ROLES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id BIGINT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- 8. DISPATCHES TABLE (Participant List Dispatch History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dispatches (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    coordinator_name TEXT NOT NULL,
    dispatched_by TEXT DEFAULT 'Admin',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. HOMEPAGE STUDENT-COORDINATOR TEAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.homepage_coordinators (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    tag TEXT,
    icon TEXT DEFAULT 'Users',
    color TEXT DEFAULT 'from-blue-500 to-cyan-500',
    desc_text TEXT,
    members JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 999,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.homepage_coordinators ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Users';
ALTER TABLE public.homepage_coordinators ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'from-blue-500 to-cyan-500';
ALTER TABLE public.homepage_coordinators ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'emerald';
ALTER TABLE public.homepage_coordinators ADD COLUMN IF NOT EXISTS desc_text TEXT;

-- ------------------------------------------------------------------------------
-- 10. SETTINGS TABLE (Close Registration & System Flags)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'general',
    is_registration_closed BOOLEAN DEFAULT false,
    closed_reason TEXT,
    on_spot_notice TEXT,
    closed_at TIMESTAMPTZ,
    closed_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS on_spot_notice TEXT;

-- ------------------------------------------------------------------------------
-- 11. WINNERS & SCORES TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_winners (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    winner_name TEXT NOT NULL,
    college TEXT,
    position TEXT,
    prize TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_scores (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    round INT DEFAULT 1,
    score NUMERIC DEFAULT 0,
    judges JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. SEARCH LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    results_count INT DEFAULT 0,
    user_role TEXT DEFAULT 'admin',
    searched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. DISABLE ROW LEVEL SECURITY (RLS) & GRANT FULL READ/WRITE ACCESS
-- ==============================================================================
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinators DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_coordinators DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_winners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs DISABLE ROW LEVEL SECURITY;

-- Grant permissions to public/anon/authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Notify schema cache reload
NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------------------------
-- 14. SUPABASE STORAGE BUCKET FOR PAYMENT SCREENSHOTS
-- ------------------------------------------------------------------------------
-- Create dedicated private bucket for compressed payment screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-screenshots',
    'payment-screenshots',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for payment-screenshots bucket
CREATE POLICY "Allow service_role full access to payment-screenshots"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'payment-screenshots');

CREATE POLICY "Allow authenticated full access to payment-screenshots"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-screenshots');

CREATE POLICY "Allow anon insert to payment-screenshots"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "Allow anon select to payment-screenshots"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'payment-screenshots');



