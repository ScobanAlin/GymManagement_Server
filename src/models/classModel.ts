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

export const createClass = async (data: {
    groupId: number;
    gymId: number;
    classDate: string;
    beginTime: string;
    endTime: string;
    recurrenceWeeks?: number;
}) => {
    const recurrenceWeeks = data.recurrenceWeeks && data.recurrenceWeeks > 0
        ? data.recurrenceWeeks
        : 52;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const baseDate = new Date(`${data.classDate}T00:00:00`);
        const createdRows: Array<{
            id: number;
            groupId: number;
            gymId: number;
            date: string;
            begin: string;
            end: string;
        }> = [];

        for (let week = 0; week < recurrenceWeeks; week++) {
            const occurrenceDate = new Date(baseDate);
            occurrenceDate.setDate(baseDate.getDate() + week * 7);
            const occurrenceDateIso = occurrenceDate.toISOString().split("T")[0];

            const result = await client.query(
                `INSERT INTO classes (group_id, gym_id, class_date, begin_time, end_time)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (group_id, gym_id, class_date, begin_time) DO NOTHING
                 RETURNING id, group_id AS "groupId", gym_id AS "gymId", class_date AS "date", begin_time AS "begin", end_time AS "end";`,
                [data.groupId, data.gymId, occurrenceDateIso, data.beginTime, data.endTime]
            );

            if (result.rows[0]) {
                createdRows.push(result.rows[0]);
            }
        }

        await client.query("COMMIT");

        return {
            createdCount: createdRows.length,
            recurrenceWeeks,
            firstCreated: createdRows[0] || null,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
