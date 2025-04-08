import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getBalance,
  createTopup,
  getTransactionHistory,
  handleWebhook,
} from '../controllers/balanceController.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getBalance).post(createTopup);
router.get('/history', getTransactionHistory);
router.post('/webhook', handleWebhook); // Public route

export default router;