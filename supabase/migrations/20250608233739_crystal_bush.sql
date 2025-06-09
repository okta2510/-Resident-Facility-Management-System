/*
  # Resident Facility Management System Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `phone` (text)
      - `role` (enum: admin, resident)
      - `apartment_number` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `complaint_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)

    - `complaints`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `category_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `status` (enum: open, in_progress, resolved, closed)
      - `priority` (enum: low, medium, high, urgent)
      - `image_url` (text, optional)
      - `admin_notes` (text, optional)
      - `resolved_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `facilities`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `capacity` (integer)
      - `requires_approval` (boolean)
      - `operating_hours_start` (time)
      - `operating_hours_end` (time)
      - `is_active` (boolean)
      - `image_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `facility_bookings`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `booking_date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `status` (enum: pending, approved, rejected, cancelled)
      - `purpose` (text, optional)
      - `notes` (text, optional)
      - `admin_notes` (text, optional)
      - `approved_by` (uuid, foreign key, optional)
      - `approved_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Users can only see their own data unless they're admin
    - Admins have full access to manage system

  3. Indexes
    - Add indexes for frequently queried columns
    - Composite indexes for complex queries
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'resident');
CREATE TYPE complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  role user_role DEFAULT 'resident',
  apartment_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Complaint categories table
CREATE TABLE IF NOT EXISTS complaint_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES complaint_categories(id),
  title text NOT NULL,
  description text NOT NULL,
  status complaint_status DEFAULT 'open',
  priority complaint_priority DEFAULT 'medium',
  image_url text,
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  capacity integer DEFAULT 1,
  requires_approval boolean DEFAULT false,
  operating_hours_start time DEFAULT '08:00',
  operating_hours_end time DEFAULT '22:00',
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Facility bookings table
CREATE TABLE IF NOT EXISTS facility_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status booking_status DEFAULT 'pending',
  purpose text,
  notes text,
  admin_notes text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default complaint categories
INSERT INTO complaint_categories (name, description) VALUES
  ('Maintenance', 'General maintenance issues and repairs'),
  ('Plumbing', 'Water leaks, pipe issues, and plumbing problems'),
  ('Electrical', 'Power outages, faulty wiring, and electrical issues'),
  ('HVAC', 'Heating, ventilation, and air conditioning problems'),
  ('Noise', 'Noise complaints and disturbances'),
  ('Security', 'Security concerns and safety issues'),
  ('Cleaning', 'Common area cleaning and sanitation'),
  ('Other', 'Other issues not covered by specific categories')
ON CONFLICT (name) DO NOTHING;

-- Insert default facilities
INSERT INTO facilities (name, description, capacity, requires_approval, operating_hours_start, operating_hours_end) VALUES
  ('Swimming Pool', 'Community swimming pool with lifeguard on duty', 50, false, '06:00', '22:00'),
  ('Meeting Room A', 'Large meeting room for community events', 30, true, '08:00', '20:00'),
  ('Meeting Room B', 'Small meeting room for private gatherings', 15, true, '08:00', '20:00'),
  ('Gym', 'Fully equipped fitness center', 25, false, '05:00', '23:00'),
  ('Tennis Court', 'Outdoor tennis court', 4, false, '06:00', '21:00'),
  ('BBQ Area', 'Outdoor barbecue and picnic area', 20, true, '10:00', '20:00')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_facility_id ON facility_bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_user_id ON facility_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_date ON facility_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_status ON facility_bookings(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for complaint_categories table
CREATE POLICY "Anyone can read complaint categories"
  ON complaint_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage complaint categories"
  ON complaint_categories FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for complaints table
CREATE POLICY "Users can read own complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

CREATE POLICY "Users can create own complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for facilities table
CREATE POLICY "Anyone can read active facilities"
  ON facilities FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

CREATE POLICY "Admins can manage facilities"
  ON facilities FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for facility_bookings table
CREATE POLICY "Users can read own bookings"
  ON facility_bookings FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

CREATE POLICY "Users can create own bookings"
  ON facility_bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own bookings"
  ON facility_bookings FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facility_bookings_updated_at BEFORE UPDATE ON facility_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();