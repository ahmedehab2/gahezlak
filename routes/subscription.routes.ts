import { Router } from "express";
import * as subscriptionController from "../controllers/subscription.controller";
import { protect } from "../middlewares/auth";

const router = Router();

// Create subscription (existing)
router.post("/", protect, subscriptionController.createSubscriptionHandler);

// Get all subscriptions (admin only)
router.get("/", protect, subscriptionController.getAllSubscriptionsHandler);

// Get subscription by ID (admin only)
router.get("/:subscriptionId", protect, subscriptionController.getSubscriptionByIdHandler);

export default router;
