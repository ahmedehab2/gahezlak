import { Router } from 'express';
import { subscribe, cancelSubscription, getSubscriptionStatus, getAllSubscriptions } from '../controllers/subscription.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.post('/subscribe', protect, subscribe);
router.post('/cancel', protect, cancelSubscription);
router.get('/status', protect, getSubscriptionStatus);
router.get('/', protect, getAllSubscriptions);

export default router; 