import { Request, Response } from "express";
import {
    getAllPayments,
    getPaymentsByStudent,
    createPayment,
    deletePayment,
    updatePayment,
    getUnpaidStudents,
    getAllStudentsWithPaymentStatus,
    getAllStoredMonths
} from "../models/paymentModel";

export const getAllPaymentsController = async (req: Request, res: Response) => {
    try {
        const payments = await getAllPayments();
        res.json(payments);
    } catch (err) {
        console.error("Error loading payments:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPaymentsByStudentController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        const { year, month } = req.query;

        // If year and month are provided, filter by those; otherwise return all
        if (year && month && typeof year === 'string' && typeof month === 'string') {
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            const payments = await getPaymentsByStudent(studentId, yearNum, monthNum);
            res.json(payments);
        } else {
            const payments = await getPaymentsByStudent(studentId);
            res.json(payments);
        }
    } catch (err) {
        console.error("Error loading payments by student:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createPaymentController = async (req: Request, res: Response) => {
    try {
        const { amount, studentId, year, month, paymentDate } = req.body;

        if (!amount || !studentId || !year || !month) {
            return res.status(400).json({ message: "Missing required fields: amount, studentId, year, month" });
        }

        const payment = await createPayment({
            amount,
            studentId,
            year: parseInt(year),
            month: parseInt(month),
            paymentDate
        });

        res.status(201).json(payment);
    } catch (err) {
        console.error("Error creating payment:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deletePaymentController = async (req: Request, res: Response) => {
    try {
        const paymentId = Number(req.params.id);
        const result = await deletePayment(paymentId);
        if (!result) {
            return res.status(404).json({ message: "Payment not found" });
        }
        res.status(200).json({ message: "Payment deleted successfully" });
    } catch (err) {
        console.error("Error deleting payment:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updatePaymentController = async (req: Request, res: Response) => {
    try {
        const paymentId = Number(req.params.id);
        const { amount, year, month, paymentDate } = req.body;

        const payment = await updatePayment(paymentId, {
            amount,
            year: year ? parseInt(year) : undefined,
            month: month ? parseInt(month) : undefined,
            paymentDate
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(200).json(payment);
    } catch (error) {
        console.error("Error updating payment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUnpaidStudentsController = async (req: Request, res: Response) => {
    try {
        const { year, month } = req.query;

        if (!year || !month || typeof year !== 'string' || typeof month !== 'string') {
            return res.status(400).json({ message: "Year and month parameters are required" });
        }

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        const unpaidStudents = await getUnpaidStudents(yearNum, monthNum);
        res.json(unpaidStudents);
    } catch (err) {
        console.error("Error loading unpaid students:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllStudentsWithPaymentStatusController = async (req: Request, res: Response) => {
    try {
        const { year, month } = req.query;

        if (!year || !month || typeof year !== 'string' || typeof month !== 'string') {
            return res.status(400).json({ message: "Year and month parameters are required" });
        }

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        console.log(`Fetching payment status for ${yearNum}-${monthNum}`);
        const students = await getAllStudentsWithPaymentStatus(yearNum, monthNum);
        console.log(`Found ${students.length} students`);
        res.json(students);
    } catch (err) {
        console.error("Error loading students with payment status:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllStoredMonthsController = async (req: Request, res: Response) => {
    try {
        const months = await getAllStoredMonths();
        console.log("Available months in database:", months);
        res.json(months);
    } catch (err) {
        console.error("Error loading stored months:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
