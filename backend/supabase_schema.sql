-- ====================================================================
-- FarmAssist AI — Supabase PostgreSQL Database Schema & Security Setup
-- ====================================================================

-- 1. Enable Row Level Security & Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PUBLIC PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT DEFAULT 'Raju Reddy',
    role TEXT CHECK (role IN ('farmer', 'expert', 'admin')) DEFAULT 'farmer',
    preferred_language TEXT DEFAULT 'en',
    country TEXT DEFAULT 'India',
    state TEXT DEFAULT 'Andhra Pradesh',
    district TEXT DEFAULT 'Kakinada',
    city_town TEXT DEFAULT 'Kakinada',
    village TEXT DEFAULT 'Samalkota',
    latitude DOUBLE PRECISION DEFAULT 16.98,
    longitude DOUBLE PRECISION DEFAULT 82.24,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. SOIL REPORTS TABLE
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

-- 4. CROP ANALYSES TABLE
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

-- 5. ADVISORIES TABLE
CREATE TABLE IF NOT EXISTS public.advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.soil_reports(id) ON DELETE SET NULL,
    crop_analysis_id UUID REFERENCES public.crop_analyses(id) ON DELETE SET NULL,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    farmer_name TEXT DEFAULT 'Raju Reddy',
    farmer_location TEXT DEFAULT 'Kakinada, Andhra Pradesh',
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

-- 6. EXPERT REVIEWS TABLE
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
  INSERT INTO public.profiles (id, email, full_name, role, preferred_language)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Farmer User'),
    COALESCE(new.raw_user_meta_data->>'role', 'farmer'),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
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
ALTER TABLE public.soil_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 2. SOIL REPORTS POLICIES
CREATE POLICY "Farmers can read own soil reports"
  ON public.soil_reports FOR SELECT
  USING (auth.uid() = farmer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

CREATE POLICY "Farmers can insert own soil reports"
  ON public.soil_reports FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

-- 3. CROP ANALYSES POLICIES
CREATE POLICY "Farmers can read own crop analyses"
  ON public.crop_analyses FOR SELECT
  USING (auth.uid() = farmer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

CREATE POLICY "Farmers can insert own crop analyses"
  ON public.crop_analyses FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

-- 4. ADVISORIES POLICIES
CREATE POLICY "Farmers can read own advisories"
  ON public.advisories FOR SELECT
  USING (auth.uid() = farmer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

CREATE POLICY "Experts and admins can update advisories"
  ON public.advisories FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

-- 5. EXPERT REVIEWS POLICIES
CREATE POLICY "Experts can insert expert reviews"
  ON public.expert_reviews FOR INSERT
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

CREATE POLICY "Experts and admins can read expert reviews"
  ON public.expert_reviews FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('expert', 'admin'));

-- ====================================================================
-- STORAGE BUCKET CREATION INSTRUCTIONS
-- Create public or authenticated buckets in Supabase Storage:
-- 1. 'soil-reports' (for PDF, PNG, JPG soil documents)
-- 2. 'crop-images' (for uploaded crop leaf photos)
-- ====================================================================
