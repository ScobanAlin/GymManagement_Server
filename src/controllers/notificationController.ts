import { Request, Response } from "express";
import { deleteNotification, getAllNotifications, updateNotificationRead, createNotification } from "../models/notificationModel";
import { AuthRequest } from "../middlewares/authMiddleware";

export const getAllNotificationsController = async (req: Request, res: Response) => {
    try {
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        const notifications = await getAllNotifications(search);
        res.json(notifications);
    } catch (err) {
        console.error("Error loading notifications:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateNotificationReadController = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { isRead } = req.body;

        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid notification id" });
        }

        if (typeof isRead !== "boolean") {
            return res.status(400).json({ message: "isRead must be boolean" });
        }

        const updated = await updateNotificationRead(id, isRead);
        if (!updated) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json(updated);
    } catch (err) {
        console.error("Error updating notification:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteNotificationController = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid notification id" });
        }

        const deleted = await deleteNotification(id);
        if (!deleted) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification deleted" });
    } catch (err) {
        console.error("Error deleting notification:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createNotificationController = async (req: AuthRequest, res: Response) => {
    try {
        const { description, studentId, groupId } = req.body;
        const coachId = req.user?.id ?? null;

        if (!description || typeof description !== "string") {
            return res.status(400).json({ message: "description is required" });
        }

        const created = await createNotification({
            description: description.trim(),
            studentId: studentId ? Number(studentId) : null,
            groupId: groupId ? Number(groupId) : null,
            coachId
        });

        res.status(201).json(created);
    } catch (err) {
        console.error("Error creating notification:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
