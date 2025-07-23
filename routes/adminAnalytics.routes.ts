import express from "express";
import {
  getTotalPlatformRevenueController,
  getRevenueGrowthController,
  getTopPerformingRestaurantsController,
} from "../controllers/adminAnalytics.controller";
import { protect, isAllowed } from "../middlewares/auth";

const router = express.Router();

// Protect all routes and allow only admin
router.use(protect, isAllowed(["admin"]));

router.get("analytics/revenue", getTotalPlatformRevenueController);
router.get("analytics/revenue-growth", getRevenueGrowthController);
router.get("analytics/top-restaurants", getTopPerformingRestaurantsController);

export default router;
