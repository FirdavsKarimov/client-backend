import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  addToCart,
  getCart,
  removeFromCart,
  checkoutCart,
} from '../controllers/cartController.js';

const router = express.Router();

router.use(protect);
router.route('/').post(addToCart).get(getCart);
router.route('/:itemId').delete(removeFromCart);
router.route('/checkout').post(checkoutCart);

export default router;