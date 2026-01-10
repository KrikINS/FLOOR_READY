-- Create a trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, full_name, role, status)
VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        'Employee',
        -- Default role
        'Pending' -- Default status
    );
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();