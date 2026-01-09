-- Add status column to profiles table
ALTER TABLE profiles
ADD COLUMN status TEXT CHECK (status IN ('Pending', 'Active', 'Suspended')) DEFAULT 'Pending';
-- Update existing users to 'Active' so they don't get locked out
UPDATE profiles
SET status = 'Active';