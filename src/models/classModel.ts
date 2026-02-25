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

/**
 * Creates recurring class entries for a group.
 *
 * Supply either the legacy single-day pattern OR the new weekly-schedule pattern:
 *
 * Legacy:  classDate + recurrenceWeeks  → creates one entry per week for N weeks
 * New:     startDate + endDate + weekdays (JS day numbers 0=Sun…6=Sat)
 *           → creates one entry per matching weekday within the date range
 *
 * beginTime / endTime apply to every created row.
 */
export const createClass = async (data: {
    groupId: number;
    gymId: number;
    beginTime: string;
    endTime: string;
    // --- new weekly-schedule fields ---
    startDate?: string;
    endDate?: string;
    weekdays?: number[]; // JS day numbers: 0=Sun, 1=Mon … 6=Sat
    // --- legacy fields (still supported) ---
    classDate?: string;
    recurrenceWeeks?: number;
}) => {
    const client = await pool.connect();

    type CreatedRow = {
        id: number;
        groupId: number;
        gymId: number;
        date: string;
        begin: string;
        end: string;
    };

    const createdRows: CreatedRow[] = [];

    try {
        await client.query("BEGIN");

        // ── New weekly-schedule path ──────────────────────────────────────────
        if (data.startDate && data.endDate && data.weekdays && data.weekdays.length > 0) {
            const weekdaySet = new Set(data.weekdays);
            const cursor = new Date(`${data.startDate}T00:00:00`);
            const end = new Date(`${data.endDate}T00:00:00`);

            while (cursor <= end) {
                if (weekdaySet.has(cursor.getDay())) {
                    const dateIso = cursor.toISOString().split("T")[0];

                    const result = await client.query(
                        `INSERT INTO classes (group_id, gym_id, class_date, begin_time, end_time)
                         VALUES ($1, $2, $3, $4, $5)
                         ON CONFLICT (group_id, gym_id, class_date, begin_time) DO NOTHING
                         RETURNING id, group_id AS "groupId", gym_id AS "gymId",
                                   class_date AS "date", begin_time AS "begin", end_time AS "end";`,
                        [data.groupId, data.gymId, dateIso, data.beginTime, data.endTime]
                    );

                    if (result.rows[0]) createdRows.push(result.rows[0]);
                }

                cursor.setDate(cursor.getDate() + 1);
            }

            // ── Legacy single-day / recurrence-weeks path ─────────────────────────
        } else if (data.classDate) {
            const recurrenceWeeks = data.recurrenceWeeks && data.recurrenceWeeks > 0
                ? data.recurrenceWeeks
                : 52;

            const baseDate = new Date(`${data.classDate}T00:00:00`);

            for (let week = 0; week < recurrenceWeeks; week++) {
                const occurrenceDate = new Date(baseDate);
                occurrenceDate.setDate(baseDate.getDate() + week * 7);
                const occurrenceDateIso = occurrenceDate.toISOString().split("T")[0];

                const result = await client.query(
                    `INSERT INTO classes (group_id, gym_id, class_date, begin_time, end_time)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (group_id, gym_id, class_date, begin_time) DO NOTHING
                     RETURNING id, group_id AS "groupId", gym_id AS "gymId",
                               class_date AS "date", begin_time AS "begin", end_time AS "end";`,
                    [data.groupId, data.gymId, occurrenceDateIso, data.beginTime, data.endTime]
                );

                if (result.rows[0]) createdRows.push(result.rows[0]);
            }
        } else {
            throw new Error("Provide either (startDate + endDate + weekdays) or classDate");
        }

        await client.query("COMMIT");

        return {
            createdCount: createdRows.length,
            firstCreated: createdRows[0] || null,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const deleteClassById = async (classId: number) => {
    await pool.query(`DELETE FROM classes WHERE id = $1`, [classId]);
};
