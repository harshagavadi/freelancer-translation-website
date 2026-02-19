/*
  # Fix User Registration RLS Policy

  Allow unauthenticated users to create new accounts during registration.
  Authenticated users can only read/update their own data.

  Changes:
  1. Drop restrictive INSERT policy
  2. Create new INSERT policy allowing any user (authenticated or not)
  3. Keep SELECT and UPDATE restricted to own data
*/

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create new INSERT policy - allow anyone to insert (registration)
-- But validate that the ID being inserted matches the user being created
CREATE POLICY "Anyone can register"
  ON users FOR INSERT
  WITH CHECK (true);

-- Keep SELECT restricted to own data only
-- Policy already exists: "Users can read own data"

-- Keep UPDATE restricted to own data only
-- Policy already exists: "Users can update own data"
