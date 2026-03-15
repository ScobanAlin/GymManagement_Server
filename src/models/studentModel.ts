import pool from '../db';

export const getAllStudents = async () => {
    const result = await pool.query(`
        SELECT s.id, s.first_name AS "firstName", s.last_name AS "lastName",
               s.email, s.subscription_type AS "subscriptionType", s.status,
               g.id AS "groupId", g.name AS "groupName"
        FROM students s
        LEFT JOIN student_group sg ON sg.student_id = s.id
        LEFT JOIN groups g ON g.id = sg.group_id
        ORDER BY s.last_name, s.first_name;
    `);
    return result.rows;
};

export const getStudentsByGroup = async (groupId: number) => {
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


export const createStudent = async (data: {
    firstName: string;
    lastName: string;
    cnp: string;
    dateOfBirth: string;
    email?: string;
    status: string;
}) => {
    const result = await pool.query(
        `
        INSERT INTO students (first_name, last_name, cnp, date_of_birth, email, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, first_name AS "firstName", last_name AS "lastName";
        `,
        [
            data.firstName,
            data.lastName,
            data.cnp,
            data.dateOfBirth,
            data.email || null,
            data.status
        ]
    );

    return result.rows[0];
};

export const deleteStudent = async (studentId: number) => {
    const result = await pool.query(
        `
        DELETE FROM students where id = $1
        `,
        [studentId]
    );
    return result.rows;
}

export const getStudentDetails = async (id: number) => {
    // Get student basic info
    const studentRes = await pool.query(
        `SELECT 
            id,
            first_name AS "firstName",
            last_name AS "lastName",
            cnp,
            date_of_birth AS "dateOfBirth",
            email,
            subscription_type AS "subscriptionType",
            status
         FROM students 
         WHERE id = $1`,
        [id]
    );

    if (studentRes.rows.length === 0) return null;
    const student = studentRes.rows[0];

    // Fetch the SINGLE group the student belongs to
    const groupRes = await pool.query(
        `SELECT 
            g.id AS "groupId",
            g.name AS "groupName"
         FROM student_group sg
         JOIN groups g ON g.id = sg.group_id
         WHERE sg.student_id = $1
         LIMIT 1;`,
        [id]
    );

    const group = groupRes.rows[0] || null;

    return {
        ...student,
        groupId: group?.groupId || null,
        groupName: group?.groupName || null
    };
};

export const assignStudentToGroup = async (studentId: number, groupId: number) => {
    await pool.query(`DELETE FROM student_group WHERE student_id = $1`, [studentId]);

    await pool.query(
        `INSERT INTO student_group (student_id, group_id) VALUES ($1, $2)`,
        [studentId, groupId]
    );
};

export const updateStudentSubscription = async (studentId: number, subscriptionType: string) => {
    await pool.query(
        `UPDATE students SET subscription_type = $1 WHERE id = $2`,
        [subscriptionType, studentId]
    );
};

export const updateStudentStatus = async (studentId: number, status: string) => {
    await pool.query(
        `UPDATE students SET status = $1 WHERE id = $2`,
        [status, studentId]
    );
};

export const updateStudentEmail = async (studentId: number, email: string) => {
    await pool.query(
        `UPDATE students SET email = $1 WHERE id = $2`,
        [email, studentId]
    );
};

export const updateStudent = async (studentId: number, data: {
    firstName: string;
    lastName: string;
    cnp: string;
    dateOfBirth: string;
    email?: string;
}) => {
    const result = await pool.query(
        `UPDATE students 
         SET first_name = $1, last_name = $2, cnp = $3, date_of_birth = $4, email = $5
         WHERE id = $6
         RETURNING id, first_name AS "firstName", last_name AS "lastName"`,
        [
            data.firstName,
            data.lastName,
            data.cnp,
            data.dateOfBirth,
            data.email || null,
            studentId
        ]
    );
    return result.rows[0];
};

export const getStudentPayments = async (studentId: number) => {
    const result = await pool.query(
        `SELECT 
            id,
            amount,
            year,
            month,
            payment_date
         FROM payments
         WHERE student_id = $1
         ORDER BY year DESC, month DESC`,
        [studentId]
    );

    return result.rows;
};
