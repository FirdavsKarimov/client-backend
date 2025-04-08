import express from 'express';
import { registerUser, authUser, createGuest } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/guest', createGuest);

export default router;