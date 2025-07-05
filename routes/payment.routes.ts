import { Router } from 'express';
import { getPaymentHistory, getPaymentById } from '../controllers/payment.controller';
import { protect } from '../middlewares/auth';

const router = Router();

// Protected routes (require authentication)
router.get('/history', protect, getPaymentHistory);
router.get('/:id', protect, getPaymentById);

export default router; 