import pool from "../db";

/**
 * Get all groups (simple categories)
 */
export const getGroups = async () => {
    const result = await pool.query(`
        SELECT id, name
        FROM groups
        ORDER BY name ASC;
    `);

    return result.rows;
};

/**
 * Create a new group category
 */
export const createGroup = async (name: string) => {
    const result = await pool.query(
        `INSERT INTO groups (name)
         VALUES ($1)
         RETURNING *;`,
        [name]
    );
    return result.rows[0];
};

/**
 * Delete a group
 */
export const deleteGroup = async (id: string) => {
    await pool.query(`DELETE FROM groups WHERE id = $1`, [id]);
};



/**
 * Fetch all students in a group
 */
export const getGroupStudents = async (groupId: number) => {
    const result = await pool.query(
        `
        SELECT s.id, s.first_name AS "firstName", s.last_name AS "lastName"
        FROM students s
        JOIN student_group sg ON sg.student_id = s.id
        WHERE sg.group_id = $1
        ORDER BY s.last_name, s.first_name;
        `,
        [groupId]
    );

    return result.rows;
};

/**
 * Fetch all classes of a group with gym info
 */
export const getGroupClasses = async (groupId: number) => {
    const result = await pool.query(
        `
        SELECT
            c.id,
            c.class_date AS "date",
            c.begin_time AS "begin",
            c.end_time AS "end",
            gy.name AS "gymName"
        FROM classes c
        JOIN gyms gy ON gy.id = c.gym_id
        WHERE c.group_id = $1
        ORDER BY c.class_date, c.begin_time;
        `,
        [groupId]
    );

    return result.rows.map(c => ({
        ...c,
        date: c.date.toISOString().split("T")[0]  // format: YYYY-MM-DD
    }));
};