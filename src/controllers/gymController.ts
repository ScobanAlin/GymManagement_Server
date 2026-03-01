import { Request, Response } from "express";
import { getGyms, createGym, updateGym, deleteGym } from "../models/gymModel";

export const getGymsController = async (req: Request, res: Response) => {
    try {
        const gyms = await getGyms();
        res.status(200).json(gyms);
    } catch (error) {
        console.error("Error fetching gyms:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createGymController = async (req: Request, res: Response) => {
    const { name, location } = req.body;
    try {
        const newGym = await createGym(name, location);
        res.status(201).json(newGym);
    } catch (error) {
        console.error("Error creating gym:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const updateGymController = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, location } = req.body;
    try {
        const updated = await updateGym(id, name, location);
        res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating gym:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteGymController = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Assuming you have a deleteGym function in your model
        await deleteGym(id);
        res.status(200).json({ message: "Gym deleted successfully" });
    } catch (error) {
        console.error("Error deleting gym:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}