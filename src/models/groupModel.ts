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

/**
 * Get the distinct recurring schedule for a group derived from future classes.
 * Returns one row per unique (weekday, beginTime, endTime, gym) combination.
 */
export const getGroupSchedule = async (groupId: number) => {
    const result = await pool.query(
        `SELECT DISTINCT
            EXTRACT(DOW FROM c.class_date)::int AS "weekday",
            c.begin_time AS "beginTime",
            c.end_time   AS "endTime",
            c.gym_id     AS "gymId",
            gy.name      AS "gymName"
        FROM classes c
        JOIN gyms gy ON c.gym_id = gy.id
        WHERE c.group_id = $1
          AND c.class_date >= CURRENT_DATE
        ORDER BY "weekday", "beginTime"`,
        [groupId]
    );
    return result.rows;
};

/**
 * Delete all future classes for a group that match a specific
 * (weekday, beginTime, endTime, gymId) slot.
 */
export const deleteFutureClassSlot = async (
    groupId: number,
    weekday: number,
    beginTime: string,
    endTime: string,
    gymId: number
) => {
    const result = await pool.query(
        `DELETE FROM classes
         WHERE group_id = $1
           AND class_date >= CURRENT_DATE
           AND EXTRACT(DOW FROM class_date)::int = $2
           AND begin_time = $3
           AND end_time   = $4
           AND gym_id     = $5`,
        [groupId, weekday, beginTime, endTime, gymId]
    );
    return result.rowCount;
};

/**
 * Get past classes (class_date < today) for a group, newest first.
 */
export const getGroupPastClasses = async (groupId: number) => {
    const result = await pool.query(
        `SELECT
            c.id,
            c.class_date AS "date",
            c.begin_time AS "begin",
            c.end_time   AS "end",
            gy.id        AS "gymId",
            gy.name      AS "gymName"
        FROM classes c
        JOIN gyms gy ON gy.id = c.gym_id
        WHERE c.group_id = $1
          AND c.class_date < CURRENT_DATE
        ORDER BY c.class_date DESC, c.begin_time ASC`,
        [groupId]
    );
    return result.rows.map(c => ({
        ...c,
        date: c.date.toISOString().split("T")[0],
    }));
};