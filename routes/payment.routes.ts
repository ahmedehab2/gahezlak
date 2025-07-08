import { Router } from 'express';
import {
  getPaymentHistoryHandler,
  getPaymentByIdHandler
} from '../controllers/payment.controller';
import { protect } from '../middlewares/auth';

const router = Router();

// Protected routes (require authentication)
router.get('/history', protect, getPaymentHistoryHandler);

export default router; 