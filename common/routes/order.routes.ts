import { CreateOrderController,CancelledOrderController,UpdateOrderStatusController,GetOrdersByShopController,GetOrderByIdController, SendOrderToKitchenController } from "../controllers/order.controller";
import { Router } from "express";
import { protect,isAllowed } from "../../middlewares/auth";
import { validateCreateOrder, validateUpdateOrderStatus } from "../../validators/order.validation";
const router= Router();

router.post("/", validateCreateOrder,CreateOrderController);
router.put("/:id/status",protect,isAllowed(["Cashier","Admin"]),validateUpdateOrderStatus,UpdateOrderStatusController);
router.put("/:id/cancel", protect ,isAllowed(["Cashier","Admin"]),CancelledOrderController);
router.get("/shop/:shopId",protect ,isAllowed(["Cashier","Admin"]), GetOrdersByShopController);
router.get("/:id", protect, isAllowed(["Cashier","Admin"]),GetOrderByIdController);
router.put("/:id/sendToKitchen", protect, isAllowed(["Cashier","Admin"]),SendOrderToKitchenController);

export default router;
