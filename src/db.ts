import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
ssl:false    })
  : new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl:false,
    });

export const createTables = async () => {
  const query = `
  -- Judges
  CREATE TABLE IF NOT EXISTS judges (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('principal', 'execution', 'artistry', 'difficulty')) NOT NULL
  );

  `;

  await pool.query(query);
  console.log("✅ Tables created (if not existing).");
};

export default pool;