import { Request, Response } from 'express';
import { createUser } from '../models/userModel';

export const register = async (req: Request, res: Response) => {
    const { first_name, last_name, email, password, role } = req.body;

    if (!email || !password || !first_name || !last_name || !role) {
        return res.status(400).json({ message: "All fields (first_name, last_name, email, password, role) are required." });
    }

    try {
        const newUser = await createUser({ first_name, last_name, email, password, role });
        return res.status(201).json({ message: "User registered successfully.", user: newUser });
    } catch (error: any) {
        console.error("Error registering user:", error);

        if (error?.message === "User already exists" || error?.code === "23505") {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        return res.status(500).json({ message: "Internal server error." });
    }

};