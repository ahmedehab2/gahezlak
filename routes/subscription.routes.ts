import { Router } from 'express';
import {
  subscribeHandler,
  cancelSubscriptionHandler,
  getSubscriptionStatusHandler,
  getAllSubscriptionsHandler
} from '../controllers/subscription.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.post('/subscribe', protect, subscribeHandler);
router.post('/cancel', protect, cancelSubscriptionHandler);
router.get('/status', protect, getSubscriptionStatusHandler);
router.get('/', protect, getAllSubscriptionsHandler);

export default router; 