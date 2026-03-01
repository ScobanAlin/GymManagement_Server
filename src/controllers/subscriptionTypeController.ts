import { Request, Response } from "express";
import {
    getAllSubscriptionTypes,
    createSubscriptionType,
    updateSubscriptionType,
    deleteSubscriptionType,
} from "../models/subscriptionTypeModel";

export const getAllSubscriptionTypesController = async (_req: Request, res: Response) => {
    try {
        const types = await getAllSubscriptionTypes();
        res.json(types);
    } catch (err) {
        console.error("Error fetching subscription types:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createSubscriptionTypeController = async (req: Request, res: Response) => {
    const { name, price } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ message: "name and price are required" });
    }
    try {
        const created = await createSubscriptionType(name.trim(), parseFloat(price));
        res.status(201).json(created);
    } catch (err: any) {
        if (err.code === "23505") {
            return res.status(409).json({ message: "Subscription type name already exists" });
        }
        console.error("Error creating subscription type:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateSubscriptionTypeController = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, price } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ message: "name and price are required" });
    }
    try {
        const updated = await updateSubscriptionType(id, name.trim(), parseFloat(price));
        if (!updated) return res.status(404).json({ message: "Subscription type not found" });
        res.json(updated);
    } catch (err: any) {
        if (err.code === "23505") {
            return res.status(409).json({ message: "Subscription type name already exists" });
        }
        console.error("Error updating subscription type:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteSubscriptionTypeController = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
        const deleted = await deleteSubscriptionType(id);
        if (!deleted) return res.status(404).json({ message: "Subscription type not found" });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        console.error("Error deleting subscription type:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
