import express from "express";
import {
  GetKitchenOrdersController,
  UpdateKitchenOrderStatusController,
} from "../controllers/kitchen.controller";
import { isAllowed } from "../middlewares/auth";

const router = express.Router();

router.get("/orders", isAllowed(["Kitchen"]), GetKitchenOrdersController);
router.put(
  "/orders/:id/status",
  isAllowed(["Kitchen"]),
  UpdateKitchenOrderStatusController
);

export default router;
