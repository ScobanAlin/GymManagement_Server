import { Request, Response } from "express";
import {
    getAllUsers,
    getUserByEmail,
    createUser,
    getCoaches,
    activateCoach,
    deleteCoach,
} from "../models/userModel";

export const getUsersController = async (_req: Request, res: Response) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ message: "Server error fetching users." });
    }
};

export const getUserByEmailController = async (req: Request, res: Response) => {
    const { email } = req.params;
    try {
        const user = await getUserByEmail(email);
        if (!user) return res.status(404).json({ message: "User not found." });

        const { password_hash, ...safeUser } = user;
        res.status(200).json(safeUser);
    } catch (error) {
        console.error("❌ Error finding user:", error);
        res.status(500).json({ message: "Server error fetching user." });
    }
};

export const createUserController = async (req: Request, res: Response) => {
    const { first_name, last_name, email, password, role } = req.body;
    try {
        const newUser = await createUser({ first_name, last_name, email, password, role });
        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error: any) {
        console.error("❌ Error creating user:", error);
        res.status(400).json({ message: error.message || "Server error creating user." });
    }
};

// ✅ New: Get all coaches
export const getCoachesController = async (_req: Request, res: Response) => {
    try {
        const coaches = await getCoaches();
        res.status(200).json(coaches);
    } catch (error) {
        console.error("❌ Error fetching coaches:", error);
        res.status(500).json({ message: "Server error fetching coaches." });
    }
};

// ✅ New: Activate coach
export const activateCoachController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updated = await activateCoach(Number(id));
        if (!updated) return res.status(404).json({ message: "Coach not found or already active." });
        res.status(200).json(updated);
    } catch (error) {
        console.error("❌ Error activating coach:", error);
        res.status(500).json({ message: "Server error activating coach." });
    }
};

// ✅ New: Delete coach
export const deleteCoachController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await deleteCoach(Number(id));
        res.status(204).send();
    } catch (error) {
        console.error("❌ Error deleting coach:", error);
        res.status(500).json({ message: "Server error deleting coach." });
    }
};
