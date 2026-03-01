import pool from "../db";

export const getPaymentsReport = async (filters?: {
    startDate?: string;
    endDate?: string;
    studentId?: number;
}) => {
    let query = `
    SELECT 
      p.id,
      p.amount,
      p.year,
      p.month,
      p.payment_date AS "paymentDate",
      s.id AS "studentId",
      s.first_name AS "studentFirstName",
      s.last_name AS "studentLastName",
      s.cnp,
      s.subscription_type AS "subscriptionType"
    FROM payments p
    JOIN students s ON p.student_id = s.id
    WHERE 1=1
  `;

    const params: any[] = [];
    let paramCount = 1;

    if (filters?.startDate) {
        query += ` AND p.payment_date >= $${paramCount++}`;
        params.push(filters.startDate);
    }

    if (filters?.endDate) {
        query += ` AND p.payment_date <= $${paramCount++}`;
        params.push(filters.endDate);
    }

    if (filters?.studentId) {
        query += ` AND p.student_id = $${paramCount++}`;
        params.push(filters.studentId);
    }

    query += ` ORDER BY p.year DESC, p.month DESC, p.payment_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getAttendanceReport = async (filters?: {
    startDate?: string;
    endDate?: string;
    studentId?: number;
    groupId?: number;
    classId?: number;
}) => {
    let query = `
    SELECT 
      a.id,
      a.attended,
      a.recorded_at AS "recordedAt",
      c.id AS "classId",
      c.class_date AS "classDate",
      c.begin_time AS "beginTime",
      c.end_time AS "endTime",
      s.id AS "studentId",
      s.first_name AS "studentFirstName",
      s.last_name AS "studentLastName",
      s.cnp,
      g.id AS "groupId",
      g.name AS "groupName",
      gym.id AS "gymId",
      gym.name AS "gymName",
      gym.location AS "gymLocation"
    FROM attendance a
    JOIN classes c ON a.class_id = c.id
    JOIN students s ON a.student_id = s.id
    JOIN groups g ON c.group_id = g.id
    JOIN gyms gym ON c.gym_id = gym.id
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

    if (filters?.studentId) {
        query += ` AND a.student_id = $${paramCount++}`;
        params.push(filters.studentId);
    }

    if (filters?.groupId) {
        query += ` AND c.group_id = $${paramCount++}`;
        params.push(filters.groupId);
    }

    if (filters?.classId) {
        query += ` AND a.class_id = $${paramCount++}`;
        params.push(filters.classId);
    }

    query += ` ORDER BY c.class_date DESC, c.begin_time DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getStudentAttendanceSummary = async (studentId: number) => {
    const result = await pool.query(
        `
    SELECT 
      s.id AS "studentId",
      s.first_name AS "firstName",
      s.last_name AS "lastName",
      COUNT(DISTINCT c.id) AS "totalClasses",
      COUNT(DISTINCT CASE WHEN a.attended = true THEN a.class_id END) AS "attendedClasses",
      COUNT(DISTINCT CASE WHEN a.attended = false THEN a.class_id END) AS "missedClasses",
      ROUND(
        (COUNT(DISTINCT CASE WHEN a.attended = true THEN a.class_id END)::DECIMAL / 
         NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 
        2
      ) AS "attendanceRate"
    FROM students s
    JOIN student_group sg ON s.id = sg.student_id
    JOIN classes c ON c.group_id = sg.group_id AND c.class_date <= CURRENT_DATE
    LEFT JOIN attendance a ON a.student_id = s.id AND a.class_id = c.id
    WHERE s.id = $1
    GROUP BY s.id, s.first_name, s.last_name
    `,
        [studentId]
    );
    return result.rows[0];
};
