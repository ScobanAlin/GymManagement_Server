import e from "express";
import pool from "../db";

export const getGyms = async () => {
    const result = await pool.query("SELECT * FROM gyms");
    return result.rows;
}

export const createGym = async (name: string, location: string, capacity: number) => {
    const result = await pool.query(
        "INSERT INTO gyms (name, location, capacity) VALUES ($1, $2, $3) RETURNING *",
        [name, location, capacity]
    );
    return result.rows[0];
}

export const deleteGym = async (id: string) => {
    await pool.query("DELETE FROM gyms WHERE id = $1", [id]);
}