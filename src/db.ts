import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
    connectionString,
    ssl: false,
  })
  : new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: false,
  });

export const createTables = async () => {
  const query = `-- ==============================
-- USERS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'inactive',
  role TEXT CHECK (role IN ('admin', 'coach')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================
-- STUDENTS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  cnp CHAR(13) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  subscription_type TEXT CHECK (subscription_type IN ('normal', 'premium')) DEFAULT 'normal',
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active'
);

-- ==============================
-- GYMS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS gyms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INT CHECK (capacity > 0)
);

-- ==============================
-- GROUPS TABLE (NO TIMES, NO GYM)
-- ==============================
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Migration safety: remove old columns if they existed
ALTER TABLE groups DROP COLUMN IF EXISTS gym_id;
ALTER TABLE groups DROP COLUMN IF EXISTS begin_time;
ALTER TABLE groups DROP COLUMN IF EXISTS end_time;

-- ==============================
-- NEW TABLE: CLASSES
-- ==============================
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  gym_id INT NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  class_date DATE NOT NULL DEFAULT CURRENT_DATE,
  begin_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE (group_id, gym_id, class_date, begin_time)
);

-- ==============================
-- STUDENT_GROUP
-- ==============================
CREATE TABLE IF NOT EXISTS student_group (
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, group_id)
);

-- ==============================
-- PAYMENTS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  month INT NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
  payment_date DATE DEFAULT CURRENT_DATE,
  UNIQUE (student_id, year, month)
);

-- Migration: Add year column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'year') THEN
    ALTER TABLE payments ADD COLUMN year INT;
    UPDATE payments SET year = EXTRACT(YEAR FROM payment_date)::INT WHERE year IS NULL;
    ALTER TABLE payments ALTER COLUMN year SET NOT NULL;
  END IF;
END $$;

-- Migration: Convert month to INT if it's still TEXT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'month' AND data_type = 'character varying') THEN
    ALTER TABLE payments ALTER COLUMN month TYPE INT USING CASE 
      WHEN month::text ~ '^[0-9]+$' THEN month::INT
      ELSE EXTRACT(MONTH FROM payment_date)::INT
    END;
  END IF;
END $$;

-- ==============================
-- ATTENDANCE TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id INT REFERENCES users(id) ON DELETE SET NULL,
  attended BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (class_id, student_id)
);

-- Migration: Add coach_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'coach_id') THEN
    ALTER TABLE attendance ADD COLUMN coach_id INT REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Migration: Remove notes column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'notes') THEN
    ALTER TABLE attendance DROP COLUMN notes;
  END IF;
END $$;

-- ==============================
-- NOTIFICATIONS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  coach_id INT REFERENCES users(id) ON DELETE SET NULL,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  group_id INT REFERENCES groups(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Migration: Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_at') THEN
    ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP;
    UPDATE notifications SET created_at = NOW() WHERE created_at IS NULL;
    ALTER TABLE notifications ALTER COLUMN created_at SET DEFAULT NOW();
  END IF;
END $$;

-- Migration: Add is_read column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    ALTER TABLE notifications ADD COLUMN is_read BOOLEAN;
    UPDATE notifications SET is_read = false WHERE is_read IS NULL;
    ALTER TABLE notifications ALTER COLUMN is_read SET NOT NULL;
    ALTER TABLE notifications ALTER COLUMN is_read SET DEFAULT false;
  END IF;
END $$;

-- ==============================
-- TRIGGER: update updated_at
-- ==============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_timestamp ON users;
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

  `;

  await pool.query(query);
  console.log("✅ Tables created or verified successfully.");
};

export default pool;

