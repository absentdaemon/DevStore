-- ============================================================================
-- DevStore Phase 9A — Real Backend, Accounts, Roles & Publishing Safety
-- Migration: 20261023000001_phase9a_init.sql
-- ============================================================================

-- 1. Custom Enum Types
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'developer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dev_app_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.app_status AS ENUM ('draft', 'pending', 'published', 'rejected', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.version_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.target_platform AS ENUM ('windows', 'android', 'web');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Developer Applications Table
CREATE TABLE IF NOT EXISTS public.developer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  website TEXT,
  intended_apps TEXT,
  status public.dev_app_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY, -- Package ID e.g. org.devstore.retrochess
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  status public.app_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Application Versions Table (Package Binaries)
CREATE TABLE IF NOT EXISTS public.app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  platform public.target_platform NOT NULL,
  package_path TEXT NOT NULL, -- Private Storage Path
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  sha256_checksum TEXT NOT NULL CHECK (length(sha256_checksum) = 64),
  release_notes TEXT,
  status public.version_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  review_feedback TEXT,
  CONSTRAINT unique_app_version_platform UNIQUE (app_id, version, platform)
);

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  device TEXT NOT NULL DEFAULT 'Desktop',
  comment TEXT NOT NULL,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_app_review UNIQUE (app_id, user_id)
);

-- 7. Favorites / Library Table
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, app_id)
);

-- 8. Moderation Audit Logs Table
CREATE TABLE IF NOT EXISTS public.moderation_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  target_type TEXT NOT NULL, -- 'developer_application', 'app_listing', 'app_version', 'user_account'
  target_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'approved', 'rejected', 'suspended', 'reactivated'
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Security Functions & Triggers
-- ============================================================================

-- Check if current authenticated user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Check if current authenticated user is Developer (or Admin)
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('developer', 'admin')
  );
$$;

-- Prevent role self-escalation trigger
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() AND current_user NOT IN ('postgres', 'service_role') THEN
      RAISE EXCEPTION 'Security Violation: Cannot alter your own role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_role_self_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_role_self_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- Auto-create profile on auth.users sign-up with default 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Admin Developer Approval Procedure
CREATE OR REPLACE FUNCTION public.admin_approve_developer_application(app_id UUID, notes TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  applicant_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can approve developer applications.';
  END IF;

  SELECT user_id INTO applicant_id FROM public.developer_applications WHERE id = app_id;
  IF applicant_id IS NULL THEN
    RAISE EXCEPTION 'Developer application not found.';
  END IF;

  UPDATE public.developer_applications
  SET status = 'approved',
      admin_notes = notes,
      reviewed_by = auth.uid(),
      updated_at = now()
  where id = app_id;

  UPDATE public.profiles
  SET role = 'developer',
      updated_at = now()
  WHERE id = applicant_id;

  INSERT INTO public.moderation_audit_logs (admin_id, target_type, target_id, action, reason)
  VALUES (auth.uid(), 'developer_application', app_id::TEXT, 'approved', notes);
END;
$$;

-- Admin Developer Rejection Procedure
CREATE OR REPLACE FUNCTION public.admin_reject_developer_application(app_id UUID, notes TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can reject developer applications.';
  END IF;

  UPDATE public.developer_applications
  SET status = 'rejected',
      admin_notes = notes,
      reviewed_by = auth.uid(),
      updated_at = now()
  WHERE id = app_id;

  INSERT INTO public.moderation_audit_logs (admin_id, target_type, target_id, action, reason)
  VALUES (auth.uid(), 'developer_application', app_id::TEXT, 'rejected', notes);
END;
$$;

-- Admin Version Approval & App Publishing Procedure
CREATE OR REPLACE FUNCTION public.admin_approve_version(ver_id UUID, feedback TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_app_id TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can approve application versions.';
  END IF;

  SELECT app_id INTO target_app_id FROM public.app_versions WHERE id = ver_id;
  IF target_app_id IS NULL THEN
    RAISE EXCEPTION 'Application version not found.';
  END IF;

  UPDATE public.app_versions
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_feedback = feedback
  WHERE id = ver_id;

  -- Transition parent app to published if in draft/pending
  UPDATE public.applications
  SET status = 'published',
      updated_at = now()
  WHERE id = target_app_id AND status IN ('draft', 'pending');

  INSERT INTO public.moderation_audit_logs (admin_id, target_type, target_id, action, reason)
  VALUES (auth.uid(), 'app_version', ver_id::TEXT, 'approved', feedback);
END;
$$;

-- Admin Version Rejection Procedure
CREATE OR REPLACE FUNCTION public.admin_reject_version(ver_id UUID, feedback TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can reject application versions.';
  END IF;

  UPDATE public.app_versions
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_feedback = feedback
  WHERE id = ver_id;

  INSERT INTO public.moderation_audit_logs (admin_id, target_type, target_id, action, reason)
  VALUES (auth.uid(), 'app_version', ver_id::TEXT, 'rejected', feedback);
END;
$$;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Self profile update" ON public.profiles;
CREATE POLICY "Self profile update" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- Developer Applications Policies
DROP POLICY IF EXISTS "Applicant read own application" ON public.developer_applications;
CREATE POLICY "Applicant read own application" ON public.developer_applications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "User submit developer application" ON public.developer_applications;
CREATE POLICY "User submit developer application" ON public.developer_applications
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage applications" ON public.developer_applications;
CREATE POLICY "Admin manage applications" ON public.developer_applications
  FOR UPDATE USING (public.is_admin());

-- Applications Policies
DROP POLICY IF EXISTS "Public read published applications" ON public.applications;
CREATE POLICY "Public read published applications" ON public.applications
  FOR SELECT USING (status = 'published' OR developer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Developer insert applications" ON public.applications;
CREATE POLICY "Developer insert applications" ON public.applications
  FOR INSERT WITH CHECK (developer_id = auth.uid() AND public.is_developer());

DROP POLICY IF EXISTS "Developer update own applications" ON public.applications;
CREATE POLICY "Developer update own applications" ON public.applications
  FOR UPDATE USING (
    (developer_id = auth.uid() AND status IN ('draft', 'rejected'))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Developer delete draft applications" ON public.applications;
CREATE POLICY "Developer delete draft applications" ON public.applications
  FOR DELETE USING (
    (developer_id = auth.uid() AND status = 'draft')
    OR public.is_admin()
  );

-- Application Versions Policies
DROP POLICY IF EXISTS "Public read approved versions" ON public.app_versions;
CREATE POLICY "Public read approved versions" ON public.app_versions
  FOR SELECT USING (
    (status = 'approved' AND EXISTS (
      SELECT 1 FROM public.applications a WHERE a.id = app_id AND a.status = 'published'
    ))
    OR EXISTS (
      SELECT 1 FROM public.applications a WHERE a.id = app_id AND a.developer_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Developer insert versions" ON public.app_versions;
CREATE POLICY "Developer insert versions" ON public.app_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = app_id AND a.developer_id = auth.uid() AND public.is_developer()
    )
  );

DROP POLICY IF EXISTS "Developer or admin manage versions" ON public.app_versions;
CREATE POLICY "Developer or admin manage versions" ON public.app_versions
  FOR UPDATE USING (
    public.is_admin()
    OR (
      EXISTS (SELECT 1 FROM public.applications a WHERE a.id = app_id AND a.developer_id = auth.uid())
      AND status = 'pending'
    )
  );

-- Reviews Policies
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users post review" ON public.reviews;
CREATE POLICY "Authenticated users post review" ON public.reviews
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "User update own review" ON public.reviews;
CREATE POLICY "User update own review" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "User or admin delete review" ON public.reviews;
CREATE POLICY "User or admin delete review" ON public.reviews
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Favorites Policies
DROP POLICY IF EXISTS "User view own favorites" ON public.favorites;
CREATE POLICY "User view own favorites" ON public.favorites
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User add favorite" ON public.favorites;
CREATE POLICY "User add favorite" ON public.favorites
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "User remove favorite" ON public.favorites;
CREATE POLICY "User remove favorite" ON public.favorites
  FOR DELETE USING (user_id = auth.uid());

-- Moderation Audit Logs Policies
DROP POLICY IF EXISTS "Admin only view audit logs" ON public.moderation_audit_logs;
CREATE POLICY "Admin only view audit logs" ON public.moderation_audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin insert audit logs" ON public.moderation_audit_logs;
CREATE POLICY "Admin insert audit logs" ON public.moderation_audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- ============================================================================
-- Supabase Storage Buckets Configuration
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-packages', 'app-packages', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Developers upload packages
DROP POLICY IF EXISTS "Developers upload packages" ON storage.objects;
CREATE POLICY "Developers upload packages" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'app-packages'
    AND auth.role() = 'authenticated'
    AND public.is_developer()
  );

-- Storage Policy: Developer or Admin read private package
DROP POLICY IF EXISTS "Developer or Admin read package" ON storage.objects;
CREATE POLICY "Developer or Admin read package" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'app-packages'
    AND (
      public.is_admin()
      OR (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::TEXT)
    )
  );

-- Storage Policy: Public read app-assets (icons & screenshots)
DROP POLICY IF EXISTS "Public read app-assets" ON storage.objects;
CREATE POLICY "Public read app-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-assets');

-- Storage Policy: Developers upload app-assets
DROP POLICY IF EXISTS "Developers upload app-assets" ON storage.objects;
CREATE POLICY "Developers upload app-assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'app-assets'
    AND auth.role() = 'authenticated'
    AND public.is_developer()
  );
