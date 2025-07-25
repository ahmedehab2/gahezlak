import { Router } from "express";
import {
  createReportController,
  getAllAdminReportsController,
  getAllShopReportsController,

} from "../controllers/report.controller";
import { protect, isAllowed } from "../middlewares/auth";
import { Role } from "../models/Role";
import { isShopMember } from "../middlewares/shop-member-check.middleware";
import { createReportValidation } from "../validators/report.validator";

const router = Router();

// Anyone (even without auth) can submit report to send shop
router.post("/:shopName", createReportValidation,createReportController);
// Anyone (even without auth) can submit report to send admin
router.post("/", createReportValidation ,createReportController);

// Admin dashboard
router.get("/admin", protect, isAllowed([Role.ADMIN]), getAllAdminReportsController);

// Shop dashboard
router.get("/shop", protect, isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),isShopMember ,getAllShopReportsController);

export default router;
