import express from "express";
import {
  GetKitchenOrdersController,
  UpdateKitchenOrderStatusController,
} from "../controllers/kitchen.controller";
import { isAllowed } from "../middlewares/auth";

const router = express.Router();

router.get(
  "/kitchen/orders",
  isAllowed(["Kitchen"]),
  GetKitchenOrdersController
);
router.put(
  "/kitchen/orders/:id/status",
  isAllowed(["Kitchen"]),
  UpdateKitchenOrderStatusController
);

export default router;
