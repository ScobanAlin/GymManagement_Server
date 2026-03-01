import { Request, Response } from "express";
import {
    getUpcomingClasses,
    getClassAttendance,
    getGroupStudentsForAttendance,
    markPresent,
    markAbsent,
    getStudentObservations,
    getRecentObservations,
    createObservation,
} from "../models/attendanceModel";
import { AuthRequest } from "../middlewares/authMiddleware";

/**
 * GET /attendance/upcoming
 * Get upcoming classes
 */
export const getUpcomingClassesController = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const filters: any = {};
        if (startDate) filters.startDate = startDate as string;
        if (endDate) filters.endDate = endDate as string;

        const classes = await getUpcomingClasses(filters);
        res.status(200).json(classes);
    } catch (error) {
        console.error("Error fetching upcoming classes:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /attendance/classes/:classId
 * Get attendance records for a class
 */
export const getClassAttendanceController = async (req: Request, res: Response) => {
    try {
        const classId = Number(req.params.classId);

        if (isNaN(classId)) {
            return res.status(400).json({ message: "Invalid class ID" });
        }

        const records = await getClassAttendance(classId);
        res.status(200).json(records);
    } catch (error) {
        console.error("Error fetching class attendance:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /attendance/groups/:groupId/students
 * Get students in a group for attendance marking
 */
export const getGroupStudentsController = async (req: Request, res: Response) => {
    try {
        const groupId = Number(req.params.groupId);

        if (isNaN(groupId)) {
            return res.status(400).json({ message: "Invalid group ID" });
        }

        const students = await getGroupStudentsForAttendance(groupId);
        res.status(200).json(students);
    } catch (error) {
        console.error("Error fetching group students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /attendance/classes/:classId/students/:studentId/present
 * Mark a student as present (create attendance record)
 */
export const markPresentController = async (req: AuthRequest, res: Response) => {
    try {
        const classId = Number(req.params.classId);
        const studentId = Number(req.params.studentId);
        const coachId = req.user?.id;

        if (isNaN(classId) || isNaN(studentId)) {
            return res.status(400).json({ message: "Invalid class or student ID" });
        }

        const record = await markPresent(classId, studentId, coachId);
        res.status(200).json(record);
    } catch (error) {
        console.error("Error marking present:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /attendance/classes/:classId/students/:studentId/absent
 * Mark a student as absent (create attendance record with attended=false)
 */
export const markAbsentController = async (req: AuthRequest, res: Response) => {
    try {
        const classId = Number(req.params.classId);
        const studentId = Number(req.params.studentId);
        const coachId = req.user?.id;

        if (isNaN(classId) || isNaN(studentId)) {
            return res.status(400).json({ message: "Invalid class or student ID" });
        }

        const record = await markAbsent(classId, studentId, coachId);
        res.status(200).json(record);
    } catch (error) {
        console.error("Error marking absent:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /observations/students/:studentId
 * Get observations for a specific student
 */
export const getStudentObservationsController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);

        if (isNaN(studentId)) {
            return res.status(400).json({ message: "Invalid student ID" });
        }

        const observations = await getStudentObservations(studentId);
        res.status(200).json(observations);
    } catch (error) {
        console.error("Error fetching student observations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /observations/recent
 * Get recent observations across all students
 */
export const getRecentObservationsController = async (req: AuthRequest, res: Response) => {
    try {
        const { limit, groupId } = req.query;
        const coachId = req.user?.id;

        if (!coachId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const filters: any = {};
        if (groupId) filters.groupId = Number(groupId);

        const limitNum = limit ? Number(limit) : 50;
        const observations = await getRecentObservations(coachId, limitNum, filters);
        res.status(200).json(observations);
    } catch (error) {
        console.error("Error fetching recent observations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /observations/create
 * Create a new observation for a student
 */
export const createObservationController = async (req: AuthRequest, res: Response) => {
    try {
        const { classId, studentId, notes, attended } = req.body;
        const coachId = req.user?.id;

        if (!coachId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        if (!classId || !studentId || !notes) {
            return res.status(400).json({ message: "Missing required fields: classId, studentId, notes" });
        }

        const observation = await createObservation(
            Number(classId),
            Number(studentId),
            coachId,
            notes,
            attended !== undefined ? Boolean(attended) : true
        );

        res.status(201).json(observation);
    } catch (error) {
        console.error("Error creating observation:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
