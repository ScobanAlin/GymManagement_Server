import { Request, Response } from "express";
import { sendPaymentReminderEmail } from "../utils/emailService";
import pool from "../db";

export const sendPaymentReminderController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.id);
        const { month, year } = req.body;

        // Get student info
        const studentRes = await pool.query(
            `SELECT first_name AS "firstName", last_name AS "lastName", email FROM students WHERE id = $1`,
            [studentId]
        );

        if (studentRes.rows.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        const student = studentRes.rows[0];

        if (!student.email) {
            return res.status(400).json({ message: "Student does not have an email address" });
        }

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthName = monthNames[(month - 1)] || `Month ${month}`;

        await sendPaymentReminderEmail(
            student.email,
            `${student.firstName} ${student.lastName}`,
            monthName,
            year
        );

        res.status(200).json({ message: `Payment reminder sent to ${student.email}` });
    } catch (error) {
        console.error("Error sending payment reminder:", error);
        res.status(500).json({ message: "Failed to send payment reminder email" });
    }
};
