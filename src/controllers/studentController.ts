import { Request, Response } from "express";
import { getAllStudents, getStudentsByGroup, createStudent } from "../models/studentModel";

import pool from '../db';

export const getAllStudentsController = async (req: Request, res: Response) => {
    try {
        const students = await getAllStudents();
        res.json(students);
    } catch (err) {
        console.error("Error loading students:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStudentsByGroupController = async (req: Request, res: Response) => {
    try {
        const students = await getStudentsByGroup(Number(req.params.groupId));
        res.json(students);
    } catch (err) {
        console.error("Error loading students by group:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createStudentController = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, cnp, dateOfBirth, status, groupId } = req.body;

        const student = await createStudent({
            firstName,
            lastName,
            cnp,
            dateOfBirth,
            status
        });

        if (groupId) {
            await pool.query(
                `INSERT INTO student_group (student_id, group_id) VALUES ($1, $2)`,
                [student.id, groupId]
            );
        }

        res.status(201).json(student);
    } catch (err) {
        console.error("Error creating student:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};


