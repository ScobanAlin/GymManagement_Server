import { Request, Response  } from 'express';

import {sayHello} from '../models/helloModel'

export const hello = (req: Request,res: Response) => 
{
    try {
    res.status(200).json({ message: sayHello() });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};