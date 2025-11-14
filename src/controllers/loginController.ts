import { Request, Response } from 'express';
import { checkUserLogin } from '../models/loginModel'
import { generateToken } from '../utils/generateToken';


export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password
    ) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const user = await checkUserLogin(email, password);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        return res.status(200).json({
            message: "Login successful",
            user,
            token,
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};