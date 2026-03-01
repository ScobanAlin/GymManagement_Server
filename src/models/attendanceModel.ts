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
 * Get attendance records for a specific class.
 * Returns all active group students with their attendance status.
 * Students without an attendance record have attended = null (unmarked).
 */
export const getClassAttendance = async (classId: number) => {
    const result = await pool.query(`
        SELECT 
            a.id,
            $1::int AS "classId",
            s.id AS "studentId",
            a.attended,
            a.recorded_at AS "recordedAt",
            s.first_name AS "studentFirstName",
            s.last_name AS "studentLastName",
            s.cnp
        FROM classes c
        JOIN student_group sg ON sg.group_id = c.group_id
        JOIN students s ON s.id = sg.student_id AND s.status = 'active'
        LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = s.id
        WHERE c.id = $1
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
 * Mark a student as present for a class (INSERT attendance record).
 * Uses ON CONFLICT to handle race conditions.
 */
export const markPresent = async (
    classId: number,
    studentId: number,
    coachId?: number
) => {
    const result = await pool.query(`
        INSERT INTO attendance (class_id, student_id, coach_id, attended, recorded_at)
        VALUES ($1, $2, $3, true, NOW())
        ON CONFLICT (class_id, student_id) DO UPDATE SET attended = true, coach_id = COALESCE($3, attendance.coach_id), recorded_at = NOW()
        RETURNING id, class_id AS "classId", student_id AS "studentId", attended, recorded_at AS "recordedAt"
    `, [classId, studentId, coachId || null]);

    return result.rows[0];
};

/**
 * Mark a student as absent for a class (INSERT/UPDATE attendance record with attended = false).
 */
export const markAbsent = async (
    classId: number,
    studentId: number,
    coachId?: number
) => {
    const result = await pool.query(`
        INSERT INTO attendance (class_id, student_id, coach_id, attended, recorded_at)
        VALUES ($1, $2, $3, false, NOW())
        ON CONFLICT (class_id, student_id) DO UPDATE SET attended = false, coach_id = COALESCE($3, attendance.coach_id), recorded_at = NOW()
        RETURNING id, class_id AS "classId", student_id AS "studentId", attended, recorded_at AS "recordedAt"
    `, [classId, studentId, coachId || null]);

    return result.rows[0];
};

/**
 * Get all observations (attendance records) for a student
 */
export const getStudentObservations = async (studentId: number) => {
    const result = await pool.query(`
        SELECT 
            a.id,
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
        WHERE a.student_id = $1
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
        WHERE a.coach_id = $1
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
 * Create a new observation for a student in a class.
 * Also marks the student as present (creates attendance record if needed).
 */
export const createObservation = async (
    classId: number,
    studentId: number,
    coachId: number,
    notes: string,
    attended: boolean = true
) => {
    // Create/update attendance record with the given status
    await pool.query(`
        INSERT INTO attendance (class_id, student_id, coach_id, attended, recorded_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (class_id, student_id) DO UPDATE SET attended = $4, coach_id = $3, recorded_at = NOW()
    `, [classId, studentId, coachId, attended]);

    // Fetch and return the observation data
    const result = await pool.query(`
        SELECT 
            a.id,
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
        FROM classes c
        JOIN groups g ON c.group_id = g.id
        JOIN gyms gy ON c.gym_id = gy.id
        JOIN students s ON s.id = $2
        LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = s.id
        WHERE c.id = $1
    `, [classId, studentId]);

    return result.rows[0];
};
