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
  const query = `
  -- ==============================
  -- USERS TABLE
  -- ==============================
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INT CHECK (age > 0),
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
  -- GROUPS TABLE
  -- ==============================
  CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    gym_id INT REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    begin_time TIME NOT NULL,
    end_time TIME NOT NULL
  );

  -- ==============================
  -- STUDENT_GROUP (many-to-many)
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
    month TEXT NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE
  );

  -- ==============================
  -- NOTIFICATIONS TABLE
  -- ==============================
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    coach_id INT REFERENCES users(id) ON DELETE SET NULL,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    description TEXT NOT NULL
  );

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

