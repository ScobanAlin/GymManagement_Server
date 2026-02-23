import { Request, Response } from "express";
import { getAttendanceReport, getPaymentsReport, getStudentAttendanceSummary } from "../models/reportModel";

export const getPaymentsReportController = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, studentId } = req.query;

        const filters: any = {};
        if (startDate) filters.startDate = startDate as string;
        if (endDate) filters.endDate = endDate as string;
        if (studentId) filters.studentId = Number(studentId);

        const report = await getPaymentsReport(filters);
        res.json(report);
    } catch (err) {
        console.error("Error generating payments report:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAttendanceReportController = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, studentId, groupId, classId } = req.query;

        const filters: any = {};
        if (startDate) filters.startDate = startDate as string;
        if (endDate) filters.endDate = endDate as string;
        if (studentId) filters.studentId = Number(studentId);
        if (groupId) filters.groupId = Number(groupId);
        if (classId) filters.classId = Number(classId);

        const report = await getAttendanceReport(filters);
        res.json(report);
    } catch (err) {
        console.error("Error generating attendance report:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStudentAttendanceSummaryController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        if (Number.isNaN(studentId)) {
            return res.status(400).json({ message: "Invalid student ID" });
        }

        const summary = await getStudentAttendanceSummary(studentId);
        res.json(summary);
    } catch (err) {
        console.error("Error getting student attendance summary:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
