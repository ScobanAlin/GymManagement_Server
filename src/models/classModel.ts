import pool from "../db";

export const getClasses = async () => {
    const result = await pool.query(`
        SELECT 
            c.id,
            g.id AS "groupId",
            g.name AS "groupName",
            gy.id AS "gymId",
            gy.name AS "gymName",
            c.class_date AS "date",
            c.begin_time AS "begin",
            c.end_time AS "end"
        FROM classes c
        JOIN groups g ON c.group_id = g.id
        JOIN gyms gy ON c.gym_id = gy.id
        ORDER BY gy.name, c.class_date, c.begin_time;
    `);

    return result.rows.map(row => {
        const weekday = new Date(row.date).toLocaleDateString("en-US", { weekday: "long" });
        const hour = row.begin.slice(0, 5); // "HH:MM"

        return {
            id: row.id,
            gymId: row.gymId,
            gymName: row.gymName,
            weekday,
            hour,
            coach: "Unknown", // add later if needed
        };
    });
};
