import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  buy711Service,
  extend711Service,
  get711Traffic,
} from '../controllers/provider711Controller.js';

const router = express.Router();

router.use(protect);
router.post('/buy', buy711Service);
router.post('/extend', extend711Service);
router.get('/traffic', get711Traffic);

export default router;