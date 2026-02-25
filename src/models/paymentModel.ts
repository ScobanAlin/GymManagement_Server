import pool from '../db';

export const getAllPayments = async () => {
    const result = await pool.query(`
        SELECT 
            p.id,
            p.amount,
            p.year,
            p.month,
            p.payment_date AS "paymentDate",
            s.id AS "studentId",
            s.first_name AS "firstName",
            s.last_name AS "lastName"
        FROM payments p
        JOIN students s ON p.student_id = s.id
        ORDER BY p.year DESC, p.month DESC, p.payment_date DESC
    `);
    return result.rows;
};

export const getPaymentsByStudent = async (studentId: number, year?: number, month?: number) => {
    let query = `
        SELECT 
            id,
            amount,
            year,
            month,
            payment_date AS "paymentDate"
        FROM payments
        WHERE student_id = $1
    `;
    const params: any[] = [studentId];

    if (year !== undefined && month !== undefined) {
        query += ` AND year = $2 AND month = $3`;
        params.push(year, month);
    }

    query += ` ORDER BY year DESC, month DESC, payment_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const createPayment = async (data: {
    amount: number;
    studentId: number;
    year: number;
    month: number;
    paymentDate?: string;
}) => {
    const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];
    const result = await pool.query(`
        INSERT INTO payments (amount, student_id, year, month, payment_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, amount, year, month, payment_date AS "paymentDate"
    `, [data.amount, data.studentId, data.year, data.month, paymentDate]);
    return result.rows[0];
};

export const deletePayment = async (paymentId: number) => {
    const result = await pool.query(`
        DELETE FROM payments WHERE id = $1 RETURNING id
    `, [paymentId]);
    return result.rows.length > 0;
};

export const updatePayment = async (paymentId: number, data: {
    amount?: number;
    year?: number;
    month?: number;
    paymentDate?: string;
}) => {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.amount !== undefined) {
        updates.push(`amount = $${paramCount++}`);
        values.push(data.amount);
    }
    if (data.year !== undefined) {
        updates.push(`year = $${paramCount++}`);
        values.push(data.year);
    }
    if (data.month !== undefined) {
        updates.push(`month = $${paramCount++}`);
        values.push(data.month);
    }
    if (data.paymentDate !== undefined) {
        updates.push(`payment_date = $${paramCount++}`);
        values.push(data.paymentDate);
    }

    if (updates.length === 0) return null;

    values.push(paymentId);
    const result = await pool.query(`
        UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, amount, year, month, payment_date AS "paymentDate"
    `, values);
    return result.rows[0];
};

export const getUnpaidStudents = async (year: number, month: number) => {
    const result = await pool.query(`
        SELECT 
            s.id,
            s.first_name AS "firstName",
            s.last_name AS "lastName",
            s.status,
            s.subscription_type AS "subscriptionType"
        FROM students s
        WHERE s.status = 'active'
        AND s.id NOT IN (
            SELECT DISTINCT student_id FROM payments WHERE year = $1 AND month = $2
        )
        ORDER BY s.last_name, s.first_name
    `, [year, month]);
    return result.rows;
};

export const getAllStudentsWithPaymentStatus = async (year: number, month: number) => {
    const result = await pool.query(`
        SELECT 
            s.id,
            s.first_name AS "firstName",
            s.last_name AS "lastName",
            s.status,
            s.subscription_type AS "subscriptionType",
            CASE 
                WHEN p.id IS NOT NULL THEN true
                ELSE false
            END AS "hasPaid",
            p.id AS "paymentId",
            p.amount,
            p.payment_date AS "paymentDate"
        FROM students s
        LEFT JOIN payments p ON s.id = p.student_id AND p.year = $1 AND p.month = $2
        WHERE s.status = 'active'
        ORDER BY s.last_name, s.first_name
    `, [year, month]);
    return result.rows;
};

export const getAllStoredMonths = async () => {
    const result = await pool.query(`
        SELECT DISTINCT year, month FROM payments ORDER BY year DESC, month DESC
    `);
    return result.rows;
};
