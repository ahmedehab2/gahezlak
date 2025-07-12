import { Router } from "express";
// import { initiatePaymobOrder } from '../controllers/paymob.controller';
// import { handlePaymobWebhook, verifyWebhook } from '../controllers/payment.webhook.controller';
import { protect } from "../middlewares/auth";

const router = Router();

// router.post('/orders', protect, initiatePaymobOrder);
// router.post('/webhook', handlePaymobWebhook);
// router.get('/webhook/verify', verifyWebhook);

export default router;
