import express from 'express'

import {login} from '../controllers/loginController'

const router = express();


router.post("/login" , login);

export default router;