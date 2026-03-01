import e from "express";
import pool from "../db";

export const getGyms = async () => {
    const result = await pool.query("SELECT * FROM gyms");
    return result.rows;
}

export const createGym = async (name: string, location: string) => {
    const result = await pool.query(
        "INSERT INTO gyms (name, location) VALUES ($1, $2) RETURNING *",
        [name, location]
    );
    return result.rows[0];
}

export const updateGym = async (id: string, name: string, location: string) => {
    const result = await pool.query(
        "UPDATE gyms SET name = $1, location = $2 WHERE id = $3 RETURNING *",
        [name, location, id]
    );
    return result.rows[0];
}

export const deleteGym = async (id: string) => {
    await pool.query("DELETE FROM gyms WHERE id = $1", [id]);
}