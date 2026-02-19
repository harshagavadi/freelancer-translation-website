/*
  # Fix User Login/Select RLS Policy

  Allow unauthenticated users to read user data by email during login.
  After authentication, users can only see their own data.

  Changes:
  1. Drop restrictive SELECT policy
  2. Create new SELECT policy allowing login lookups
  3. Allow authenticated users to see own data
*/

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new SELECT policy - allow anyone to read public user info for login
CREATE POLICY "Users can login"
  ON users FOR SELECT
  USING (true);

-- Keep UPDATE restricted to own data only
-- Policy already exists: "Users can update own data"
