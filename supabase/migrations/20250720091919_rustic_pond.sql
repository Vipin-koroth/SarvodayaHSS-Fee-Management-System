/*
  # Initial Schema for Sarvodaya School Fee Management System

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `admission_no` (text, unique)
      - `name` (text)
      - `mobile` (text)
      - `class` (text)
      - `division` (text)
      - `bus_stop` (text)
      - `bus_number` (text)
      - `trip_number` (text)
      - `created_at` (timestamp)

    - `payments`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `student_name` (text)
      - `admission_no` (text)
      - `development_fee` (integer)
      - `bus_fee` (integer)
      - `special_fee` (integer)
      - `special_fee_type` (text)
      - `total_amount` (integer)
      - `payment_date` (timestamp)
      - `added_by` (text)
      - `class` (text)
      - `division` (text)
      - `created_at` (timestamp)

    - `fee_config`
      - `id` (uuid, primary key)
      - `config_type` (text) - 'development_fee' or 'bus_stop'
      - `config_key` (text) - class number or bus stop name
      - `config_value` (integer) - fee amount
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no text UNIQUE NOT NULL,
  name text NOT NULL,
  mobile text NOT NULL,
  class text NOT NULL,
  division text NOT NULL,
  bus_stop text NOT NULL,
  bus_number text NOT NULL,
  trip_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  admission_no text NOT NULL,
  development_fee integer DEFAULT 0,
  bus_fee integer DEFAULT 0,
  special_fee integer DEFAULT 0,
  special_fee_type text DEFAULT '',
  total_amount integer NOT NULL,
  payment_date timestamptz NOT NULL,
  added_by text NOT NULL,
  class text NOT NULL,
  division text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create fee_config table
CREATE TABLE IF NOT EXISTS fee_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL, -- 'development_fee' or 'bus_stop'
  config_key text NOT NULL, -- class number or bus stop name
  config_value integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(config_type, config_key)
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_config ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Allow all operations for authenticated users"
  ON students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for payments table
CREATE POLICY "Allow all operations for authenticated users"
  ON payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for fee_config table
CREATE POLICY "Allow all operations for authenticated users"
  ON fee_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default fee configuration
INSERT INTO fee_config (config_type, config_key, config_value) VALUES
  -- Development fees for classes 1-10
  ('development_fee', '1', 500),
  ('development_fee', '2', 600),
  ('development_fee', '3', 700),
  ('development_fee', '4', 800),
  ('development_fee', '5', 900),
  ('development_fee', '6', 1000),
  ('development_fee', '7', 1100),
  ('development_fee', '8', 1200),
  ('development_fee', '9', 1300),
  ('development_fee', '10', 1400),
  -- Development fees for classes 11-12 with divisions
  ('development_fee', '11-A', 1500),
  ('development_fee', '11-B', 1600),
  ('development_fee', '11-C', 1700),
  ('development_fee', '11-D', 1800),
  ('development_fee', '11-E', 1900),
  ('development_fee', '12-A', 1600),
  ('development_fee', '12-B', 1700),
  ('development_fee', '12-C', 1800),
  ('development_fee', '12-D', 1900),
  ('development_fee', '12-E', 2000),
  -- Bus stop fees
  ('bus_stop', 'Main Gate', 800),
  ('bus_stop', 'Market Square', 900),
  ('bus_stop', 'Railway Station', 1000),
  ('bus_stop', 'City Center', 850),
  ('bus_stop', 'Park Avenue', 750),
  ('bus_stop', 'School Road', 700)
ON CONFLICT (config_type, config_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_class_division ON students(class, division);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_class_division ON payments(class, division);
CREATE INDEX IF NOT EXISTS idx_fee_config_type_key ON fee_config(config_type, config_key);

-- Create updated_at trigger for fee_config
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fee_config_updated_at 
    BEFORE UPDATE ON fee_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();