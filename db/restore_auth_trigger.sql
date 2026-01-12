-- ==========================================
-- RESTORE AUTH TRIGGER (Missing Link)
-- This ensures that when a user Registers, they get a Profile.
-- ==========================================
-- 1. Create the Handler Function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, full_name, role, status, email)
VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        COALESCE(new.raw_user_meta_data->>'role', 'Staff'),
        COALESCE(new.raw_user_meta_data->>'status', 'Pending'),
        new.email
    );
RETURN new;
END;
$$;
-- 2. Create the Trigger
-- Drops first to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- 3. RETROACTIVE FIX (For users you just created but have no profile)
-- This tries to create a profile for any user who doesn't have one
INSERT INTO public.profiles (id, email, role, status, full_name)
SELECT id,
    email,
    COALESCE(raw_user_meta_data->>'role', 'Staff'),
    'Pending',
    -- Default to pending for backfilled users
    COALESCE(raw_user_meta_data->>'full_name', 'Unknown')
FROM auth.users
WHERE id NOT IN (
        SELECT id
        FROM public.profiles
    ) ON CONFLICT DO NOTHING;
SELECT 'Trigger Restored & Missing Profiles Backfilled' as status;