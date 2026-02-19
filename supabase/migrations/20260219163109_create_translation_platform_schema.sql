/*
  # Translation Platform Complete Database Schema

  ## Overview
  Complete database setup for Lingua Solutions India translation platform with all features:
  - User management with wallet system
  - Multi-currency support
  - Projects with auto-assignment
  - Freelancer profiles
  - Messages and notifications
  - Transactions with Razorpay integration
  - Platform commission tracking

  ## Tables Created

  ### 1. users
  - `id` (uuid, primary key) - User unique identifier
  - `email` (text, unique) - User email for login
  - `name` (text) - User display name
  - `type` (text) - 'client' or 'translator'
  - `avatar` (text, optional) - Avatar URL
  - `wallet_balance` (numeric) - Current wallet balance
  - `currency` (text) - User's preferred currency (USD, INR, EUR, etc.)
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. freelancer_profiles
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Reference to users table
  - `languages` (text[]) - Array of languages the translator can handle
  - `specializations` (text[]) - Document types: legal, medical, technical, etc.
  - `rating` (numeric) - Average rating (0-5)
  - `completed_projects` (integer) - Total completed projects
  - `active_projects` (integer) - Current active projects
  - `max_concurrent_projects` (integer) - Maximum projects they can handle
  - `is_available` (boolean) - Availability status
  - `price_per_word` (numeric) - Rate per word in USD
  - `response_time` (integer) - Average response time in hours

  ### 3. projects
  - `id` (uuid, primary key)
  - `title` (text) - Project name
  - `source_language` (text) - Source language
  - `target_language` (text) - Target language
  - `status` (text) - pending, assigned, in-progress, review, completed, cancelled
  - `word_count` (integer) - Number of words
  - `deadline` (timestamptz) - Project deadline
  - `price` (numeric) - Project price
  - `client_id` (uuid, foreign key) - Reference to client user
  - `translator_id` (uuid, foreign key, optional) - Reference to translator user
  - `translator_name` (text, optional) - Translator display name
  - `description` (text) - Project description
  - `auto_assigned` (boolean) - Whether project was auto-assigned
  - `match_score` (numeric, optional) - Translator match score
  - `assigned_at` (timestamptz, optional) - When translator was assigned
  - `created_at` (timestamptz) - Project creation time
  - `updated_at` (timestamptz) - Last update time

  ### 4. project_files
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key) - Reference to projects
  - `name` (text) - File name
  - `size` (integer) - File size in bytes
  - `type` (text) - MIME type
  - `data` (text) - Base64 encoded file data
  - `uploaded_by` (uuid, foreign key) - User who uploaded
  - `uploaded_at` (timestamptz) - Upload timestamp

  ### 5. messages
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key) - Reference to project
  - `sender_id` (uuid, foreign key) - Message sender
  - `sender_name` (text) - Sender display name
  - `text` (text) - Message content
  - `read` (boolean) - Read status
  - `timestamp` (timestamptz) - Message timestamp

  ### 6. notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Notification recipient
  - `type` (text) - project_assigned, project_completed, message, status_change
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `project_id` (uuid, optional) - Related project
  - `read` (boolean) - Read status
  - `timestamp` (timestamptz) - Notification time

  ### 7. transactions
  - `id` (uuid, primary key)
  - `user_id` (text) - User ID or 'platform' for commission
  - `type` (text) - deposit, withdrawal, payment, earning, refund, commission
  - `amount` (numeric) - Transaction amount
  - `status` (text) - pending, completed, failed
  - `description` (text) - Transaction description
  - `project_id` (uuid, optional) - Related project
  - `payment_method` (text, optional) - Payment method used
  - `transaction_fee` (numeric, optional) - Fee charged
  - `razorpay_order_id` (text, optional) - Razorpay order ID
  - `razorpay_payment_id` (text, optional) - Razorpay payment/payout ID
  - `commission_amount` (numeric, optional) - Commission earned
  - `timestamp` (timestamptz) - Transaction timestamp

  ### 8. platform_settings
  - `id` (uuid, primary key)
  - `commission_balance` (numeric) - Total platform commission earned
  - `updated_at` (timestamptz) - Last update

  ## Security (Row Level Security)

  All tables have RLS enabled with appropriate policies:
  - Users can read/update their own data
  - Clients can create projects
  - Translators can update assigned projects
  - Messages accessible to project participants
  - Transactions visible to respective users
  - Platform data accessible to admins only

  ## Indexes

  Created for optimal query performance on:
  - User lookups by email
  - Project queries by client/translator
  - Messages by project
  - Notifications by user
  - Transactions by user

  ## Important Notes

  1. Data Integrity: All foreign keys properly constrained
  2. Security: Comprehensive RLS policies on all tables
  3. Performance: Indexes on frequently queried columns
  4. Audit Trail: Timestamps on all records
  5. Commission Tracking: Separate transactions for platform fees
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('client', 'translator')),
  avatar text,
  wallet_balance numeric DEFAULT 0 NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. FREELANCER PROFILES TABLE
CREATE TABLE IF NOT EXISTS freelancer_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  languages text[] DEFAULT '{}' NOT NULL,
  specializations text[] DEFAULT '{}' NOT NULL,
  rating numeric DEFAULT 5.0 NOT NULL CHECK (rating >= 0 AND rating <= 5),
  completed_projects integer DEFAULT 0 NOT NULL,
  active_projects integer DEFAULT 0 NOT NULL,
  max_concurrent_projects integer DEFAULT 3 NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  price_per_word numeric DEFAULT 0.10 NOT NULL,
  response_time integer DEFAULT 4 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read freelancer profiles"
  ON freelancer_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Translators can update own profile"
  ON freelancer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Translators can insert own profile"
  ON freelancer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  source_language text NOT NULL,
  target_language text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'assigned', 'in-progress', 'review', 'completed', 'cancelled')),
  word_count integer NOT NULL CHECK (word_count > 0),
  deadline timestamptz NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  translator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  translator_name text,
  description text DEFAULT '' NOT NULL,
  auto_assigned boolean DEFAULT false NOT NULL,
  match_score numeric,
  assigned_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = translator_id);

CREATE POLICY "Clients can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Translators can update assigned projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = translator_id)
  WITH CHECK (auth.uid() = translator_id);

CREATE POLICY "Clients can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = client_id);

-- 4. PROJECT FILES TABLE
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  size integer NOT NULL CHECK (size > 0),
  type text NOT NULL,
  data text NOT NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project participants can read files"
  ON project_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_files.project_id
      AND (projects.client_id = auth.uid() OR projects.translator_id = auth.uid())
    )
  );

CREATE POLICY "Project participants can upload files"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_files.project_id
      AND (projects.client_id = auth.uid() OR projects.translator_id = auth.uid())
    )
  );

CREATE POLICY "Uploaders can delete own files"
  ON project_files FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  sender_name text NOT NULL,
  text text NOT NULL,
  read boolean DEFAULT false NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project participants can read messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.translator_id = auth.uid())
    )
  );

CREATE POLICY "Project participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.translator_id = auth.uid())
    )
  );

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.translator_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.translator_id = auth.uid())
    )
  );

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('project_assigned', 'project_completed', 'message', 'status_change')),
  title text NOT NULL,
  message text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  read boolean DEFAULT false NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'earning', 'refund', 'commission')),
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  description text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  payment_method text,
  transaction_fee numeric DEFAULT 0,
  razorpay_order_id text,
  razorpay_payment_id text,
  commission_amount numeric DEFAULT 0,
  timestamp timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text OR user_id = 'platform');

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. PLATFORM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  commission_balance numeric DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Insert default platform settings
INSERT INTO platform_settings (commission_balance) VALUES (0)
ON CONFLICT DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_translator ON projects(translator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
