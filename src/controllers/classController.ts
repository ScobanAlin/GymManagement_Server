import { Request, Response } from "express";
import { getClasses, createClass, deleteClassById } from "../models/classModel";

export const getClassesController = async (_req: Request, res: Response) => {
    try {
        const classes = await getClasses();
        res.status(200).json(classes);
    } catch (error) {
        console.error("Error fetching classes:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createClassController = async (req: Request, res: Response) => {
    try {
        const { gymId, begin, end, startDate, endDate, weekdays } = req.body;
        const groupId = Number(req.params.groupId);

        if (!gymId || !begin || !end) {
            return res.status(400).json({ message: "gymId, begin, and end are required" });
        }

        // New weekly-schedule path
        if (startDate && endDate && Array.isArray(weekdays) && weekdays.length > 0) {
            const newClass = await createClass({
                groupId,
                gymId: Number(gymId),
                beginTime: begin,
                endTime: end,
                startDate,
                endDate,
                weekdays: weekdays.map(Number),
            });
            return res.status(201).json(newClass);
        }

        // Legacy single-date path (kept for backwards compat)
        const { date, recurrenceWeeks } = req.body;
        if (!date) {
            return res
                .status(400)
                .json({ message: "Provide either (startDate + endDate + weekdays) or date" });
        }

        const newClass = await createClass({
            groupId,
            gymId: Number(gymId),
            classDate: date,
            beginTime: begin,
            endTime: end,
            recurrenceWeeks: recurrenceWeeks ? Number(recurrenceWeeks) : undefined,
        });

        return res.status(201).json(newClass);
    } catch (error) {
        console.error("Error creating class:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteClassController = async (req: Request, res: Response) => {
    try {
        const classId = Number(req.params.id);
        if (isNaN(classId)) return res.status(400).json({ message: "Invalid class ID" });
        await deleteClassById(classId);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting class:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
