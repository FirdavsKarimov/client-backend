import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getPurchases,
  createPurchase,
  getPurchaseDetails,
  extendPurchase,
  getPurchaseTraffic,
  cancelPurchase,
} from '../controllers/purchaseController.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getPurchases).post(createPurchase);
router.route('/:id').get(getPurchaseDetails).delete(cancelPurchase);
router.post('/extend/:id', extendPurchase);
router.get('/traffic/:id', getPurchaseTraffic);

export default router;