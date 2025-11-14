import { Request, Response } from "express";
import { getClasses } from "../models/classModel";

export const getClassesController = async (_req: Request, res: Response) => {
    try {
        const classes = await getClasses();
        res.status(200).json(classes);
    } catch (error) {
        console.error("Error fetching classes:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
