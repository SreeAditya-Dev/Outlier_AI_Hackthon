-- Note: Run this SQL in your Supabase SQL Editor to create missing tables or fix column names

-- Check if the user_profiles table exists and if not, create it with correct column names
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- If user_profiles table exists but has wrong column names, add new columns and copy data
DO $$
BEGIN
  -- Check if 'name' column exists but 'full_name' doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'full_name'
  ) THEN
    -- Add the full_name column
    ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
    -- Copy data from name to full_name
    UPDATE public.user_profiles SET full_name = name;
  END IF;

  -- Check if 'phone' column exists but 'phone_number' doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'phone_number'
  ) THEN
    -- Add the phone_number column
    ALTER TABLE public.user_profiles ADD COLUMN phone_number TEXT;
    -- Copy data from phone to phone_number
    UPDATE public.user_profiles SET phone_number = phone;
  END IF;
END
$$;

-- Ensure travel_history table has correct relationships
CREATE TABLE IF NOT EXISTS public.travel_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  actual_distance NUMERIC,
  actual_fuel_cost NUMERIC,
  actual_toll_cost NUMERIC,
  notes TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Fix any relationship issues in travel_history table
DO $$
BEGIN
  -- Check if foreign key constraint exists for route_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'travel_history' 
    AND ccu.column_name = 'route_id'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    ALTER TABLE public.travel_history 
    ADD CONSTRAINT travel_history_route_id_fkey 
    FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Create RLS policies for the tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for travel_history
CREATE POLICY "Users can view their own travel history"
  ON public.travel_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel history"
  ON public.travel_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel history"
  ON public.travel_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.travel_history TO authenticated; 