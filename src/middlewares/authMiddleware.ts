import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../db";
import { getUserById } from "../models/userModel";

const ROLE_HIERARCHY: Record<string, number> = {
    student: 1,
    coach: 2,
    admin: 3,
};

const hasRequiredRole = (userRole: string, minimumRole: string): boolean => {
    const userRank = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredRank = ROLE_HIERARCHY[minimumRole] ?? 0;
    return userRank >= requiredRank;
};

export interface AuthRequest extends Request {
    user?: { id: number; email: string; role: string; firstName?: string; lastName?: string };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        const user = await getUserById(decoded.id);
        if (!user) return res.status(401).json({ message: "User no longer exists" });
        req.user = user;
        next();
    } catch (err) {
        console.error("Token verification failed:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

export const requireRole = (minimumRole: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const { role } = req.user;
        if (!hasRequiredRole(role, minimumRole)) {
            return res.status(403).json({ message: "Access denied: insufficient permissions" });
        }

        next();
    };
};
