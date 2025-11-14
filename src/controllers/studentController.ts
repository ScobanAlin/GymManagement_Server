import { Request, Response } from "express";
import { getAllStudents, getStudentsByGroup, createStudent,deleteStudent,getStudentDetails,assignStudentToGroup,
    updateStudentSubscription,
    updateStudentStatus,
    getStudentPayments,  } from "../models/studentModel";

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

export const deleteStudentController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.id);
        const result = await deleteStudent(studentId);
        if (!result) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.status(200).json({ message: "Student deleted successfully" });
    } catch (err) {
        console.error("Error deleting student:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStudentDetailsController = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const data = await getStudentDetails(id);

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching student details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const assignStudentToGroupController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.id);
        const { groupId } = req.body;

        await assignStudentToGroup(studentId, groupId);
        res.status(200).json({ message: "Group updated successfully" });
    } catch (error) {
        console.error("Error assigning group:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateStudentSubscriptionController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.id);
        const { subscriptionType } = req.body;

        await updateStudentSubscription(studentId, subscriptionType);
        res.status(200).json({ message: "Subscription updated successfully" });
    } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



export const updateStudentStatusController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.id);
        const { status } = req.body;

        await updateStudentStatus(studentId, status);
        res.status(200).json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStudentPaymentsController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.id);
        const payments = await getStudentPayments(studentId);

        res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};