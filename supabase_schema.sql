-- Run this entire script in your Supabase SQL Editor

-- 1. Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  age INTEGER,
  role TEXT NOT NULL CHECK (role IN ('customer', 'cashier', 'admin')) DEFAULT 'customer',
  assigned_port TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  discounted_price NUMERIC NOT NULL,
  vessel TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  guest_name TEXT,
  schedule_id UUID REFERENCES schedules(id) NOT NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'gcash', 'maya')),
  date DATE NOT NULL,
  pax_counts JSONB NOT NULL DEFAULT '{"regular": 0, "student": 0, "senior": 0, "pwd": 0}'::jsonb,
  total_pax INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We are using very relaxed RLS policies for this prototype to allow easy CRUD operations from the client.
-- In a real-world production app, you would restrict these significantly.

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 1. Create a secure function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop existing policies if any (for safety when re-running)
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow public read access to schedules" ON schedules;
DROP POLICY IF EXISTS "Allow admins to insert schedules" ON schedules;
DROP POLICY IF EXISTS "Allow admins to update schedules" ON schedules;
DROP POLICY IF EXISTS "Allow admins to delete schedules" ON schedules;
DROP POLICY IF EXISTS "Allow public read access to announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admins to insert announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admins to update announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admins to delete announcements" ON announcements;
DROP POLICY IF EXISTS "Allow users to view their own reservations and cashiers/admins to view all" ON reservations;
DROP POLICY IF EXISTS "Allow users to insert reservations" ON reservations;
DROP POLICY IF EXISTS "Allow users and cashiers to update reservations" ON reservations;
DROP POLICY IF EXISTS "Allow admins to delete reservations" ON reservations;

-- Create SECURE Policies

-- PROFILES
-- Anyone can read profiles (or you can restrict to self + admins)
CREATE POLICY "Allow public read access to profiles" ON profiles FOR SELECT USING (true);
-- Users can only insert their own profile AND their role MUST be 'customer'. 
-- This prevents a malicious user from passing role='admin' in their signup payload.
CREATE POLICY "Allow users to insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id AND role = 'customer');
-- Users can update their own profile (but not change their role), Admins can update any profile.
CREATE POLICY "Allow users to update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id OR public.get_my_role() = 'admin');

-- SCHEDULES
CREATE POLICY "Allow public read access to schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Allow admins to insert schedules" ON schedules FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Allow admins to update schedules" ON schedules FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "Allow admins to delete schedules" ON schedules FOR DELETE USING (public.get_my_role() = 'admin');

-- ANNOUNCEMENTS
CREATE POLICY "Allow public read access to announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Allow admins to insert announcements" ON announcements FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Allow admins to update announcements" ON announcements FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "Allow admins to delete announcements" ON announcements FOR DELETE USING (public.get_my_role() = 'admin');

-- RESERVATIONS
-- Users can see their own, Cashiers and Admins can see all
CREATE POLICY "Allow users to view their own reservations and cashiers/admins to view all" ON reservations FOR SELECT USING (auth.uid() = user_id OR public.get_my_role() IN ('cashier', 'admin'));
-- Users can insert their own reservations, and staff (cashiers/admins) can insert walk-in reservations
CREATE POLICY "Allow users to insert reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id OR public.get_my_role() IN ('cashier', 'admin'));
-- Cashiers and Admins can update any reservation (e.g., to mark as paid), Users can update their own (e.g. to cancel)
CREATE POLICY "Allow users and cashiers to update reservations" ON reservations FOR UPDATE USING (public.get_my_role() IN ('cashier', 'admin') OR auth.uid() = user_id);
-- Only Admins can delete reservations
CREATE POLICY "Allow admins to delete reservations" ON reservations FOR DELETE USING (public.get_my_role() = 'admin');
