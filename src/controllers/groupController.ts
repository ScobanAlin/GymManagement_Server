import { Request, Response } from "express";
import {
    getGroups,
    createGroup,
    deleteGroup,
    getGroupStudents,
    getGroupClasses
} from "../models/groupModel";

export const getGroupsController = async (req: Request, res: Response) => {
    try {
        const groups = await getGroups();
        res.status(200).json(groups);
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createGroupController = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name)
            return res.status(400).json({ message: "Name is required" });

        const group = await createGroup(name);
        res.status(201).json(group);

    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteGroupController = async (req: Request, res: Response) => {
    try {
        await deleteGroup(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting group:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



export const getGroupStudentsController = async (req: Request, res: Response) => {
    try {
        const students = await getGroupStudents(Number(req.params.id));
        res.status(200).json(students);
    } catch (error) {
        console.error("Error fetching group students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getGroupClassesController = async (req: Request, res: Response) => {
    try {
        const classes = await getGroupClasses(Number(req.params.id));
        res.status(200).json(classes);
    } catch (error) {
        console.error("Error fetching group classes:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};