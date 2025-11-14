import pool from '../db';

export const getAllStudents = async () => {
    const result = await pool.query(`
        SELECT id, first_name AS "firstName", last_name AS "lastName"
        FROM students
        ORDER BY last_name, first_name;
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
    status: string;
}) => {
    const result = await pool.query(
        `
        INSERT INTO students (first_name, last_name, cnp, date_of_birth, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, first_name AS "firstName", last_name AS "lastName";
        `,
        [
            data.firstName,
            data.lastName,
            data.cnp,
            data.dateOfBirth,
            data.status
        ]
    );

    return result.rows[0];
};
