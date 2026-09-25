-- =========================================================================
-- ELOQUENCE 2026: OFFLINE REGISTRATIONS SEPARATE TABLE SETUP
-- Database: Supabase / PostgreSQL (public schema)
-- Project Dashboard: https://supabase.com/dashboard/project/dfdugnahbtazkgdkqebs/sql
-- =========================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. OFFLINE REGISTRATIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offline_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT UNIQUE NOT NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    college TEXT DEFAULT 'C. Abdul Hakeem College of Engineering & Technology',
    department TEXT DEFAULT 'CSE',
    year TEXT DEFAULT '3rd Year',
    team_name TEXT,
    members_count INT DEFAULT 1,
    team_members JSONB DEFAULT '[]'::jsonb,
    total_fee NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'PAID',
    registration_status TEXT DEFAULT 'CONFIRMED',
    payment_method TEXT DEFAULT 'ON_SITE_DESK',
    venue_snapshot TEXT,
    timing_snapshot TEXT,
    onsite_unique_id TEXT,
    is_verified BOOLEAN DEFAULT false,
    attendance_status TEXT DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist (idempotent ALTERs)
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'ON_SITE_DESK';
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS onsite_unique_id TEXT;
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'pending';
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.offline_registrations ADD COLUMN IF NOT EXISTS notes TEXT;

-- -------------------------------------------------------------------------
-- 2. OFFLINE REGISTRATION MEMBERS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offline_registration_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.offline_registrations(id) ON DELETE CASCADE,
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

ALTER TABLE public.offline_registration_members ADD COLUMN IF NOT EXISTS ticket_code TEXT;
ALTER TABLE public.offline_registration_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.offline_registration_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.offline_registration_members ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.offline_registration_members ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.offline_registration_members ADD COLUMN IF NOT EXISTS year TEXT;

-- -------------------------------------------------------------------------
-- 3. PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------
GRANT ALL ON TABLE public.offline_registrations TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.offline_registration_members TO anon, authenticated, service_role, postgres;

ALTER TABLE public.offline_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_registration_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access on offline_registrations" ON public.offline_registrations;
CREATE POLICY "Public full access on offline_registrations" ON public.offline_registrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on offline_registration_members" ON public.offline_registration_members;
CREATE POLICY "Public full access on offline_registration_members" ON public.offline_registration_members FOR ALL USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 4. ALIAS VIEWS FOR FLEXIBLE NAMING (SINGULAR / PLURAL & CAMELCASE)
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.offline_registrations_member AS 
SELECT * FROM public.offline_registration_members;

CREATE OR REPLACE VIEW public."Offline_registrations" AS 
SELECT * FROM public.offline_registrations;

CREATE OR REPLACE VIEW public."Offline_registrations_member" AS 
SELECT * FROM public.offline_registration_members;

GRANT ALL ON public.offline_registrations_member TO anon, authenticated, service_role, postgres;
GRANT ALL ON public."Offline_registrations" TO anon, authenticated, service_role, postgres;
GRANT ALL ON public."Offline_registrations_member" TO anon, authenticated, service_role, postgres;
