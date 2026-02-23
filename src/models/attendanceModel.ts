import pool from "../db";

/**
 * Get all classes with optional date filter
 */
export const getUpcomingClasses = async (filters?: { startDate?: string; endDate?: string }) => {
    let query = `
        SELECT 
            c.id,
            c.class_date AS "classDate",
            c.begin_time AS "beginTime",
            c.end_time AS "endTime",
            g.id AS "groupId",
            g.name AS "groupName",
            gy.id AS "gymId",
            gy.name AS "gymName",
            gy.location AS "gymLocation"
        FROM classes c
        JOIN groups g ON c.group_id = g.id
        JOIN gyms gy ON c.gym_id = gy.id
        WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (filters?.startDate) {
        query += ` AND c.class_date >= $${paramCount++}`;
        params.push(filters.startDate);
    }

    if (filters?.endDate) {
        query += ` AND c.class_date <= $${paramCount++}`;
        params.push(filters.endDate);
    }

    query += ` ORDER BY c.class_date ASC, c.begin_time ASC`;

    const result = await pool.query(query, params);
    return result.rows;
};

/**
 * Get attendance records for a specific class
 */
export const getClassAttendance = async (classId: number) => {
    await pool.query(`
        INSERT INTO attendance (class_id, student_id, attended, recorded_at)
        SELECT
            c.id,
            s.id,
            false,
            NOW()
        FROM classes c
        JOIN student_group sg ON sg.group_id = c.group_id
        JOIN students s ON s.id = sg.student_id
        WHERE c.id = $1
          AND s.status = 'active'
        ON CONFLICT (class_id, student_id) DO NOTHING
    `, [classId]);

    const result = await pool.query(`
        SELECT 
            a.id,
            a.class_id AS "classId",
            a.student_id AS "studentId",
            a.attended,
            a.recorded_at AS "recordedAt",
            s.first_name AS "studentFirstName",
            s.last_name AS "studentLastName",
            s.cnp
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.class_id = $1
          AND s.status = 'active'
        ORDER BY s.last_name, s.first_name
    `, [classId]);

    return result.rows;
};

/**
 * Get all students in a group (for attendance marking)
 */
export const getGroupStudentsForAttendance = async (groupId: number) => {
    const result = await pool.query(`
        SELECT 
            s.id,
            s.first_name AS "firstName",
            s.last_name AS "lastName",
            s.cnp
        FROM students s
        JOIN student_group sg ON s.id = sg.student_id
        WHERE sg.group_id = $1 AND s.status = 'active'
        ORDER BY s.last_name, s.first_name
    `, [groupId]);

    return result.rows;
};

/**
 * Update attendance record (mark attended and/or add notes)
 */
export const updateAttendance = async (
    attendanceId: number,
    attended: boolean,
    coachId?: number
) => {
    const result = await pool.query(`
        UPDATE attendance 
        SET attended = $1, recorded_at = NOW(), coach_id = COALESCE($3, coach_id)
        WHERE id = $2
        RETURNING *
    `, [attended, attendanceId, coachId || null]);

    return result.rows[0];
};

/**
 * Get or create attendance record for a student in a class
 */
export const getOrCreateAttendance = async (classId: number, studentId: number, coachId?: number) => {
    // First try to get existing
    const existing = await pool.query(`
        SELECT * FROM attendance 
        WHERE class_id = $1 AND student_id = $2
    `, [classId, studentId]);

    if (existing.rows.length > 0) {
        return existing.rows[0];
    }

    // Create new
    const created = await pool.query(`
        INSERT INTO attendance (class_id, student_id, coach_id, attended, recorded_at)
        VALUES ($1, $2, $3, false, NOW())
        RETURNING id, class_id AS "classId", student_id AS "studentId", coach_id AS "coachId", attended, recorded_at AS "recordedAt"
    `, [classId, studentId, coachId || null]);

    return created.rows[0];
};

/**
 * Get all observations (attendance records with notes) for a student
 */
export const getStudentObservations = async (studentId: number) => {
    const result = await pool.query(`
        SELECT 
            a.id,
            a.notes,
            a.attended,
            a.recorded_at AS "recordedAt",
            c.class_date AS "classDate",
            c.begin_time AS "beginTime",
            c.end_time AS "endTime",
            g.name AS "groupName",
            gy.name AS "gymName"
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        JOIN groups g ON c.group_id = g.id
        JOIN gyms gy ON c.gym_id = gy.id
        WHERE a.student_id = $1 AND a.notes IS NOT NULL
        ORDER BY c.class_date DESC, c.begin_time DESC
    `, [studentId]);

    return result.rows;
};

/**
 * Get recent observations across all students (filter by coach and optional group)
 */
export const getRecentObservations = async (coachId: number, limit = 50, filters?: { groupId?: number }) => {
    let query = `
        SELECT 
            a.id,
            a.notes,
            a.attended,
            a.recorded_at AS "recordedAt",
            c.class_date AS "classDate",
            c.begin_time AS "beginTime",
            c.end_time AS "endTime",
            g.id AS "groupId",
            g.name AS "groupName",
            gy.name AS "gymName",
            s.id AS "studentId",
            s.first_name AS "studentFirstName",
            s.last_name AS "studentLastName"
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN classes c ON a.class_id = c.id
        JOIN groups g ON c.group_id = g.id
        JOIN gyms gy ON c.gym_id = gy.id
        WHERE a.notes IS NOT NULL AND a.coach_id = $1
    `;

    const params: any[] = [coachId];
    let paramCount = 2;

    if (filters?.groupId) {
        query += ` AND g.id = $${paramCount++}`;
        params.push(filters.groupId);
    }

    query += ` ORDER BY a.recorded_at DESC LIMIT $${paramCount++}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
};

/**
 * Create a new observation for a student in a class
 */
export const createObservation = async (
    classId: number,
    studentId: number,
    coachId: number,
    notes: string,
    attended: boolean = true
) => {
    // First check if attendance record exists
    const existing = await pool.query(`
        SELECT id FROM attendance 
        WHERE class_id = $1 AND student_id = $2
    `, [classId, studentId]);

    let attendanceId: number;

    if (existing.rows.length > 0) {
        // Update existing
        attendanceId = existing.rows[0].id;
        await pool.query(`
            UPDATE attendance 
            SET attended = $1, notes = $2, coach_id = $3, recorded_at = NOW()
            WHERE id = $4
        `, [attended, notes, coachId, attendanceId]);
    } else {
        // Create new
        const created = await pool.query(`
            INSERT INTO attendance (class_id, student_id, coach_id, attended, notes, recorded_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id
        `, [classId, studentId, coachId, attended, notes]);
        attendanceId = created.rows[0].id;
    }

    // Fetch and return the complete record
    const result = await pool.query(`
        SELECT 
            a.id,
            a.notes,
            a.attended,
            a.recorded_at AS "recordedAt",
            c.class_date AS "classDate",
            c.begin_time AS "beginTime",
            c.end_time AS "endTime",
            g.id AS "groupId",
            g.name AS "groupName",
            gy.name AS "gymName",
            s.id AS "studentId",
            s.first_name AS "studentFirstName",
            s.last_name AS "studentLastName"
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN classes c ON a.class_id = c.id
        JOIN groups g ON c.group_id = g.id
        JOIN gyms gy ON c.gym_id = gy.id
        WHERE a.id = $1
    `, [attendanceId]);

    return result.rows[0];
};
