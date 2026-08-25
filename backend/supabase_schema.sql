-- ====================================================================
-- FarmAssist AI — Supabase PostgreSQL Database Schema & Security Setup
-- ====================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PUBLIC PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('farmer', 'expert', 'admin')) DEFAULT 'farmer',
    preferred_language TEXT DEFAULT 'en',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    country TEXT,
    state TEXT,
    district TEXT,
    city_town TEXT,
    village_or_city TEXT,
    village TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    auth_provider TEXT DEFAULT 'email',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure newly added columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 3. FARM PROFILES TABLE (Dynamic Farmer & Farm Details)
CREATE TABLE IF NOT EXISTS public.farm_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_name TEXT,
    farm_size TEXT,
    current_crop TEXT,
    soil_type TEXT,
    irrigation_method TEXT,
    sowing_date TEXT,
    crop_stage TEXT,
    experience_years TEXT,
    water_source TEXT,
    survey_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. SOIL REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.soil_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'uploaded',
    raw_text TEXT,
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. CROP ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.crop_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    crop_type TEXT DEFAULT 'Paddy / Rice',
    disease_class TEXT,
    disease_name TEXT,
    confidence_score DOUBLE PRECISION DEFAULT 0.0,
    risk_level TEXT DEFAULT 'MODERATE',
    symptoms JSONB DEFAULT '[]'::jsonb,
    management_recommendations JSONB DEFAULT '[]'::jsonb,
    weather_impact TEXT,
    final_advisory TEXT,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. ADVISORIES TABLE
CREATE TABLE IF NOT EXISTS public.advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.soil_reports(id) ON DELETE SET NULL,
    crop_analysis_id UUID REFERENCES public.crop_analyses(id) ON DELETE SET NULL,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    farmer_name TEXT,
    farmer_location TEXT,
    source_type TEXT DEFAULT 'soil_analysis',
    report_summary TEXT,
    soil_health_analysis TEXT,
    crop_disease_info TEXT,
    extracted_data JSONB,
    nutrient_deficiencies JSONB,
    crop_recommendations JSONB,
    fertilizer_recommendations JSONB,
    irrigation_suggestions JSONB,
    pest_disease_alerts JSONB,
    risk_analysis JSONB,
    risk_level TEXT DEFAULT 'MODERATE',
    weather_impact TEXT,
    original_ai_advisory TEXT,
    final_advisory TEXT,
    status TEXT DEFAULT 'pending_review',
    reviewed_by TEXT,
    expert_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expert_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. EXPERT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.expert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisory_id UUID REFERENCES public.advisories(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT CHECK (action IN ('approved', 'modified', 'rejected')),
    modified_advisory TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- AUTOMATIC PROFILE TRIGGER ON AUTH.USERS INSERT
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, display_name, avatar_url, role, preferred_language, onboarding_completed, auth_provider
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'farmer', -- SECURITY RULE: ALWAYS DEFAULT TO FARMER
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en'),
    FALSE,
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    auth_provider = EXCLUDED.auth_provider;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
CREATE POLICY "Users can update own profile except role"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 2. FARM PROFILES POLICIES
DROP POLICY IF EXISTS "Farmers can read own farm profile" ON public.farm_profiles;
CREATE POLICY "Farmers can read own farm profile"
  ON public.farm_profiles FOR SELECT
  USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

DROP POLICY IF EXISTS "Farmers can insert own farm profile" ON public.farm_profiles;
CREATE POLICY "Farmers can insert own farm profile"
  ON public.farm_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farmers can update own farm profile" ON public.farm_profiles;
CREATE POLICY "Farmers can update own farm profile"
  ON public.farm_profiles FOR UPDATE
  USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 3. SOIL REPORTS POLICIES
DROP POLICY IF EXISTS "Farmers can read own soil reports" ON public.soil_reports;
CREATE POLICY "Farmers can read own soil reports"
  ON public.soil_reports FOR SELECT
  USING (auth.uid() = farmer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

DROP POLICY IF EXISTS "Farmers can insert own soil reports" ON public.soil_reports;
CREATE POLICY "Farmers can insert own soil reports"
  ON public.soil_reports FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

-- 4. CROP ANALYSES POLICIES
DROP POLICY IF EXISTS "Farmers can read own crop analyses" ON public.crop_analyses;
CREATE POLICY "Farmers can read own crop analyses"
  ON public.crop_analyses FOR SELECT
  USING (auth.uid() = farmer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

DROP POLICY IF EXISTS "Farmers can insert own crop analyses" ON public.crop_analyses;
CREATE POLICY "Farmers can insert own crop analyses"
  ON public.crop_analyses FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

-- 5. ADVISORIES POLICIES
DROP POLICY IF EXISTS "Farmers can read own advisories" ON public.advisories;
CREATE POLICY "Farmers can read own advisories"
  ON public.advisories FOR SELECT
  USING (auth.uid() = farmer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

DROP POLICY IF EXISTS "Experts and admins can update advisories" ON public.advisories;
CREATE POLICY "Experts and admins can update advisories"
  ON public.advisories FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

-- 6. EXPERT REVIEWS POLICIES
DROP POLICY IF EXISTS "Experts can insert expert reviews" ON public.expert_reviews;
CREATE POLICY "Experts can insert expert reviews"
  ON public.expert_reviews FOR INSERT
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

DROP POLICY IF EXISTS "Experts and admins can read expert reviews" ON public.expert_reviews;
CREATE POLICY "Experts and admins can read expert reviews"
  ON public.expert_reviews FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));
