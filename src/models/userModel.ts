import pool from "../db";
import bcrypt from "bcrypt";

export const getUserByEmail = async (email: string) => {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
};

export const getUserById = async (id: number) => {
    const result = await pool.query("SELECT id, email, role, first_name AS \"firstName\", last_name AS \"lastName\" FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
};

export const getAllUsers = async () => {
    const query = `
    SELECT id, first_name, last_name, email, role, status, created_at
    FROM users
    ORDER BY created_at DESC;
  `;
    const result = await pool.query(query);
    return result.rows;
};

// ✅ New: Only coaches
export const getCoaches = async () => {
    const query = `
    SELECT id, first_name, last_name, email, status, created_at
    FROM users
    WHERE role = 'coach'
    ORDER BY status DESC, created_at ASC;
  `;
    const result = await pool.query(query);
    return result.rows;
};

// ✅ New: Activate coach
export const activateCoach = async (id: number) => {
    const query = `
    UPDATE users
    SET status = 'active', updated_at = NOW()
    WHERE id = $1 AND role = 'coach'
    RETURNING id, first_name, last_name, email, status, updated_at;
  `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// ✅ New: Delete coach
export const deleteCoach = async (id: number) => {
    await pool.query("DELETE FROM users WHERE id = $1 AND role = 'coach'", [id]);
};

interface CreateUserInput {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: "admin" | "coach";
}

export const createUser = async ({
    first_name,
    last_name,
    email,
    password,
    role,
}: CreateUserInput) => {
    const existingUser = await getUserByEmail(email);
    if (existingUser) throw new Error("User already exists");

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
    INSERT INTO users (first_name, last_name, email, password_hash, role, status)
    VALUES ($1, $2, $3, $4, $5, 'inactive')
    RETURNING id, first_name, last_name, email, role, status, created_at;
  `;
    const values = [first_name, last_name, email, password_hash, role];
    const result = await pool.query(query, values);
    return result.rows[0];
};
