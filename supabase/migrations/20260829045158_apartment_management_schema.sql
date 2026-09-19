/*
# Apartment Maintenance Management — Schema

1. Purpose
   A digital maintenance bill calculation & collection app for a 60-flat apartment
   society. Supports monthly billing, UPI QR payments + receipts, late-payment
   reminders, expenditure reports, transaction history, admin dashboard with
   per-unit dues tracking, notice board, visitor management, amenity booking,
   SOS alerts, complaints, and an AI assistant.

2. Tenancy model
   Single-tenant, NO auth (no sign-in screen). The browser talks to Supabase with
   the anon key for the app's entire lifetime. Therefore EVERY policy lists
   `TO anon, authenticated` and uses `USING (true)` / `WITH CHECK (true)` because
   the data is intentionally shared across the society (admin + residents share
   one dataset). A UI-level role switcher (admin / resident) controls what is
   shown, not database-level ownership.

3. New Tables
   - society_settings  : single-row society config (name, UPI ID, bank details, rates)
   - units             : the 60 flats (unit number, owner, phone, floor, area)
   - bills             : monthly maintenance bill per unit per period
   - payments          : recorded payments against bills (method, reference, receipt)
   - expenses          : society expenditure entries (category, amount, date)
   - notices           : digital notice board (title, body, priority)
   - visitors          : visitor / gate-security entries with approval status
   - amenities         : bookable amenities (clubhouse, gym, etc.)
   - bookings          : amenity time-slot bookings by units
   - sos_alerts        : emergency SOS alerts from units
   - complaints        : maintenance complaints (plumbing, electrical, etc.)

4. Columns (per table)
   society_settings: id, name, upi_id, payee_name, bank_name, account_number,
                     ifsc, monthly_rate_per_sqft, late_fee_per_day, due_day_of_month
   units:          id, unit_number, owner_name, phone, floor, area_sqft, is_active
   bills:          id, unit_id, period_month, period_year, base_amount,
                   late_fee, total_amount, due_date, status, created_at
   payments:       id, bill_id, unit_id, amount, method, reference_no, paid_at, created_at
   expenses:       id, category, description, amount, expense_date, created_at
   notices:        id, title, body, priority, created_at
   visitors:       id, visitor_name, purpose, host_unit_id, entry_time, exit_time,
                   status, created_at
   amenities:      id, name, description, capacity, hourly_rate
   bookings:       id, amenity_id, unit_id, booking_date, start_time, end_time,
                   status, created_at
   sos_alerts:     id, unit_id, alert_type, message, status, created_at, resolved_at
   complaints:     id, unit_id, category, description, status, created_at, resolved_at

5. Security
   RLS enabled on every table. All policies are `TO anon, authenticated` with
   `USING (true)` / `WITH CHECK (true)` because this is a single-tenant shared-data
   app with no sign-in (documented above). This is the intentional public/shared
   case, not a shortcut around ownership checks.

6. Notes
   - `bills.status` is derived/managed in app logic (pending / paid / overdue).
   - `payments.bill_id` is nullable to allow ad-hoc / advance payments.
   - Unique constraint on bills (unit_id, period_month, period_year) prevents
     duplicate billing for the same period.
*/

-- ---------- society_settings ----------
CREATE TABLE IF NOT EXISTS society_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Green Valley Apartments',
  upi_id text NOT NULL DEFAULT 'society@upi',
  payee_name text NOT NULL DEFAULT 'Green Valley Society',
  bank_name text NOT NULL DEFAULT 'State Bank of India',
  account_number text NOT NULL DEFAULT '0000000000000',
  ifsc text NOT NULL DEFAULT 'SBIN0000000',
  monthly_rate_per_sqft numeric(10,2) NOT NULL DEFAULT 3.00,
  late_fee_per_day numeric(10,2) NOT NULL DEFAULT 5.00,
  due_day_of_month int NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE society_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_settings" ON society_settings;
CREATE POLICY "anon_read_settings" ON society_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_settings" ON society_settings;
CREATE POLICY "anon_write_settings" ON society_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON society_settings;
CREATE POLICY "anon_update_settings" ON society_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- units ----------
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number text NOT NULL UNIQUE,
  owner_name text NOT NULL,
  phone text,
  floor int NOT NULL DEFAULT 1,
  area_sqft numeric(10,2) NOT NULL DEFAULT 1000,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_units" ON units;
CREATE POLICY "anon_read_units" ON units FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_units" ON units;
CREATE POLICY "anon_insert_units" ON units FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_units" ON units;
CREATE POLICY "anon_update_units" ON units FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_units" ON units;
CREATE POLICY "anon_delete_units" ON units FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- bills ----------
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year int NOT NULL,
  base_amount numeric(12,2) NOT NULL DEFAULT 0,
  late_fee numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','partial')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (unit_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_bills_unit ON bills(unit_id);
CREATE INDEX IF NOT EXISTS idx_bills_period ON bills(period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_bills" ON bills;
CREATE POLICY "anon_read_bills" ON bills FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bills" ON bills;
CREATE POLICY "anon_insert_bills" ON bills FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bills" ON bills;
CREATE POLICY "anon_update_bills" ON bills FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bills" ON bills;
CREATE POLICY "anon_delete_bills" ON bills FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- payments ----------
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE SET NULL,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  method text NOT NULL DEFAULT 'upi' CHECK (method IN ('upi','cash','bank_transfer','cheque')),
  reference_no text,
  paid_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_unit ON payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_payments" ON payments;
CREATE POLICY "anon_read_payments" ON payments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- expenses ----------
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  description text,
  amount numeric(12,2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_expenses" ON expenses;
CREATE POLICY "anon_read_expenses" ON expenses FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- notices ----------
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','urgent')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notices_created ON notices(created_at DESC);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_notices" ON notices;
CREATE POLICY "anon_read_notices" ON notices FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notices" ON notices;
CREATE POLICY "anon_insert_notices" ON notices FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notices" ON notices;
CREATE POLICY "anon_update_notices" ON notices FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notices" ON notices;
CREATE POLICY "anon_delete_notices" ON notices FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- visitors ----------
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  purpose text,
  host_unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  entry_time timestamptz,
  exit_time timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','checked_in','checked_out','denied')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_host ON visitors(host_unit_id);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_visitors" ON visitors;
CREATE POLICY "anon_read_visitors" ON visitors FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_visitors" ON visitors;
CREATE POLICY "anon_insert_visitors" ON visitors FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_visitors" ON visitors;
CREATE POLICY "anon_update_visitors" ON visitors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_visitors" ON visitors;
CREATE POLICY "anon_delete_visitors" ON visitors FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- amenities ----------
CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  capacity int NOT NULL DEFAULT 1,
  hourly_rate numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_amenities" ON amenities;
CREATE POLICY "anon_read_amenities" ON amenities FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_amenities" ON amenities;
CREATE POLICY "anon_insert_amenities" ON amenities FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_amenities" ON amenities;
CREATE POLICY "anon_update_amenities" ON amenities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_amenities" ON amenities;
CREATE POLICY "anon_delete_amenities" ON amenities FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- bookings ----------
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_id uuid NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_amenity ON bookings(amenity_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_unit ON bookings(unit_id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_bookings" ON bookings;
CREATE POLICY "anon_read_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- sos_alerts ----------
CREATE TABLE IF NOT EXISTS sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'general',
  message text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_unit ON sos_alerts(unit_id);

ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_sos" ON sos_alerts;
CREATE POLICY "anon_read_sos" ON sos_alerts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sos" ON sos_alerts;
CREATE POLICY "anon_insert_sos" ON sos_alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sos" ON sos_alerts;
CREATE POLICY "anon_update_sos" ON sos_alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sos" ON sos_alerts;
CREATE POLICY "anon_delete_sos" ON sos_alerts FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- complaints ----------
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('plumbing','electrical','cleaning','security','other','general')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_complaints_unit ON complaints(unit_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_complaints" ON complaints;
CREATE POLICY "anon_read_complaints" ON complaints FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
CREATE POLICY "anon_insert_complaints" ON complaints FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;
CREATE POLICY "anon_update_complaints" ON complaints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_complaints" ON complaints;
CREATE POLICY "anon_delete_complaints" ON complaints FOR DELETE
  TO anon, authenticated USING (true);
