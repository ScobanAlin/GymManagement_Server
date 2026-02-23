import { Request, Response } from "express";
import { getClasses, createClass } from "../models/classModel";

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
        const { gymId, date, begin, end, recurrenceWeeks } = req.body;
        const groupId = Number(req.params.groupId);

        if (!gymId || !date || !begin || !end) {
            return res.status(400).json({ message: "gymId, date, begin, and end are required" });
        }

        const newClass = await createClass({
            groupId,
            gymId,
            classDate: date,
            beginTime: begin,
            endTime: end,
            recurrenceWeeks: recurrenceWeeks ? Number(recurrenceWeeks) : undefined,
        });

        res.status(201).json(newClass);
    } catch (error) {
        console.error("Error creating class:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
