import express from 'express';
import {
  createPayment,
  handleCryptomusWebhook,
  handlePaymentCallback,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/webhook', handleCryptomusWebhook);
router.get('/callback', handlePaymentCallback);

export default router;