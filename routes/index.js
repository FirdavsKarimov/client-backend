import { Router } from 'express';
import authRoutes from './authRoutes.js';
import balanceRoutes from './balanceRoutes.js';
import purchaseRoutes from './purchaseRoutes.js';
import provider711Routes from './provider711Routes.js';
import paymentRoutes from './paymentRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/balance', balanceRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/provider/711', provider711Routes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;