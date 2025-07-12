import { Router } from "express";
import * as subscriptionController from "../controllers/subscription.controller";
import { protect } from "../middlewares/auth";

const router = Router();

router.post("/", protect, subscriptionController.createSubscriptionHandler);
// router.post('/cancel', protect, cancelSubscriptionHandler);
// router.get('/status', protect, getSubscriptionStatusHandler);
// router.get('/', protect, getAllSubscriptionsHandler);

export default router;
