-- Function to allow Admins to delete a user
-- Run this in Supabase Dashboard > SQL Editor
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE requester_role text;
BEGIN -- 1. Check if the user requesting the delete is an Admin
SELECT role INTO requester_role
FROM public.profiles
WHERE id = auth.uid();
IF requester_role <> 'Admin' THEN RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
END IF;
-- 2. Delete the user (this cascades to profiles via foreign key)
DELETE FROM auth.users
WHERE id = target_user_id;
END;
$$;