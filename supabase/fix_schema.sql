-- Fix schema issues with travel_history relationships
DO $$
DECLARE
  has_table_travel_history BOOLEAN;
  has_column_route_id BOOLEAN;
BEGIN
  -- Check if travel_history table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'travel_history'
  ) INTO has_table_travel_history;
  
  IF has_table_travel_history THEN
    -- Check if route_id column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'travel_history' AND column_name = 'route_id'
    ) INTO has_column_route_id;
    
    -- If the foreign key constraint doesn't exist and the column exists, create it
    IF has_column_route_id AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'travel_history' 
      AND ccu.column_name = 'id'
      AND ccu.table_name = 'routes'
    ) THEN
      -- Add foreign key constraint
      BEGIN
        ALTER TABLE public.travel_history 
        ADD CONSTRAINT travel_history_route_id_fkey 
        FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint from travel_history.route_id to routes.id';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign key constraint: %', SQLERRM;
      END;
    END IF;
  ELSE
    RAISE NOTICE 'travel_history table does not exist';
  END IF;
END;
$$;

-- Fix user_profiles table to ensure it has both sets of column names
DO $$
DECLARE
  column_exists_name BOOLEAN;
  column_exists_full_name BOOLEAN;
  column_exists_phone BOOLEAN;
  column_exists_phone_number BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'name'
  ) INTO column_exists_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'full_name'
  ) INTO column_exists_full_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'phone'
  ) INTO column_exists_phone;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'phone_number'
  ) INTO column_exists_phone_number;
  
  -- If name doesn't exist but full_name does, add name column
  IF NOT column_exists_name AND column_exists_full_name THEN
    ALTER TABLE public.user_profiles ADD COLUMN name TEXT;
    UPDATE public.user_profiles SET name = full_name;
    RAISE NOTICE 'Added name column and copied data from full_name';
  END IF;
  
  -- If phone doesn't exist but phone_number does, add phone column
  IF NOT column_exists_phone AND column_exists_phone_number THEN
    ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
    UPDATE public.user_profiles SET phone = phone_number;
    RAISE NOTICE 'Added phone column and copied data from phone_number';
  END IF;
  
  -- If full_name doesn't exist but name does, add full_name column
  IF NOT column_exists_full_name AND column_exists_name THEN
    ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
    UPDATE public.user_profiles SET full_name = name;
    RAISE NOTICE 'Added full_name column and copied data from name';
  END IF;
  
  -- If phone_number doesn't exist but phone does, add phone_number column
  IF NOT column_exists_phone_number AND column_exists_phone THEN
    ALTER TABLE public.user_profiles ADD COLUMN phone_number TEXT;
    UPDATE public.user_profiles SET phone_number = phone;
    RAISE NOTICE 'Added phone_number column and copied data from phone';
  END IF;
END;
$$;

-- Create trigger to keep both name/full_name and phone/phone_number in sync
CREATE OR REPLACE FUNCTION sync_user_profile_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.name IS DISTINCT FROM OLD.name AND NEW.name IS NOT NULL THEN
      NEW.full_name := NEW.name;
    ELSIF NEW.full_name IS DISTINCT FROM OLD.full_name AND NEW.full_name IS NOT NULL THEN
      NEW.name := NEW.full_name;
    END IF;
    
    IF NEW.phone IS DISTINCT FROM OLD.phone AND NEW.phone IS NOT NULL THEN
      NEW.phone_number := NEW.phone;
    ELSIF NEW.phone_number IS DISTINCT FROM OLD.phone_number AND NEW.phone_number IS NOT NULL THEN
      NEW.phone := NEW.phone_number;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.name IS NULL AND NEW.full_name IS NOT NULL THEN
      NEW.name := NEW.full_name;
    ELSIF NEW.full_name IS NULL AND NEW.name IS NOT NULL THEN
      NEW.full_name := NEW.name;
    END IF;
    
    IF NEW.phone IS NULL AND NEW.phone_number IS NOT NULL THEN
      NEW.phone := NEW.phone_number;
    ELSIF NEW.phone_number IS NULL AND NEW.phone IS NOT NULL THEN
      NEW.phone_number := NEW.phone;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_user_profiles_columns ON public.user_profiles;

-- Create trigger
CREATE TRIGGER sync_user_profiles_columns
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION sync_user_profile_columns(); 