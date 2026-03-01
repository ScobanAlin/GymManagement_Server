import pool from "../db";

export const getAllSubscriptionTypes = async () => {
    const result = await pool.query(
        `SELECT id, name, price FROM subscription_types ORDER BY name`
    );
    return result.rows;
};

export const getSubscriptionTypeByName = async (name: string) => {
    const result = await pool.query(
        `SELECT id, name, price FROM subscription_types WHERE name = $1`,
        [name]
    );
    return result.rows[0] ?? null;
};

export const createSubscriptionType = async (name: string, price: number) => {
    const result = await pool.query(
        `INSERT INTO subscription_types (name, price) VALUES ($1, $2) RETURNING *`,
        [name, price]
    );
    return result.rows[0];
};

export const updateSubscriptionType = async (id: number, name: string, price: number) => {
    const result = await pool.query(
        `UPDATE subscription_types SET name = $1, price = $2 WHERE id = $3 RETURNING *`,
        [name, price, id]
    );
    return result.rows[0] ?? null;
};

export const deleteSubscriptionType = async (id: number) => {
    const result = await pool.query(
        `DELETE FROM subscription_types WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0] ?? null;
};
