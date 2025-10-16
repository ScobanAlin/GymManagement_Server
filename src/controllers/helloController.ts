import { Request, Response  } from 'express';

export const hello = (req: Request,res: Response) => 
{
    try {
    res.status(200).json({ message: 'Hello World!' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};