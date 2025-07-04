import { CreateOrderController,CancelledOrderController,UpdateOrderStatusController,GetOrdersByShopController } from "../controllers/order.controller";
import { Router } from "express";

const router= Router();

router.post("/", CreateOrderController);
router.put("/:id/status", UpdateOrderStatusController);
router.put("/:id/cancel", CancelledOrderController);
router.get("/shop/:shopId", GetOrdersByShopController);

export default router;
