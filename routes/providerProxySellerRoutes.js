import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  buyProxySellerService,
  extendProxySellerService,
  getProxySellerTraffic,
} from '../controllers/providerProxySellerController.js';

const router = express.Router();

router.use(protect);
router.post('/buy', buyProxySellerService);
router.post('/extend', extendProxySellerService);
router.get('/traffic', getProxySellerTraffic);

export default router;