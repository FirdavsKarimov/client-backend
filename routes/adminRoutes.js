import express from 'express';
import { protect, adminCheck } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  getUserDetails,
  updateUserBalance,
  getAllTransactions,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, adminCheck);

router.get('/users', getAllUsers);
router.route('/users/:id').get(getUserDetails).put(updateUserBalance);
router.get('/transactions', getAllTransactions);

export default router;