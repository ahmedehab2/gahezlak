import express from "express";
import * as controllers from "../controllers/shop.controller";
import { isAllowed, protect } from "../middlewares/auth";
import * as validators from "../validators/shop.validator";
import { Role } from "../models/Role";

// menu items imports

import {
  createMenuItemAndAddToCategoryHandler,
  getMenuItemByIdHandler,
  deleteMenuItemHandler,
  toggleItemAvailabilityHandler,
} from "../controllers/menu-item.controller";

import {
  validateCreateMenuItem,
  validateToggleAvailability,
  validateGetOrDeleteItemById,
} from "../validators/menu-item.validator";

// category imports

import {
  createCategoryHandler,
  getCategoriesWithItemsByShopHandler,
  updateCategoryHandler,
  deleteCategoryAndItemsHandler,
  getItemsInCategoryHandler,
  getCategoryByIdHandler,
} from "../controllers/category.controller";

import {
  categoryParamValidators,
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
  updateItemInCategoryValidator,
} from "../validators/category.validators";

// Order imports

import {
  createOrderHandler,
  cancelledOrderHandler,
  updateOrderStatusHandler,
  getOrdersByShopHandler,
  getOrderByIdHandler,
  sendOrderToKitchenHandler,
} from "../controllers/order.controller";
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
} from "../validators/order.validator";

// kitchen imports

import {
  getKitchenOrdersHandler,
  updateKitchenOrderStatusHandler,
} from "../controllers/kitchen.controller";

import { validateOrderId } from "../validators/order.validator";

const router = express.Router();

router.post(
  "/",
  protect,
  validators.creatShopValidator,
  controllers.createShopHandler
);
router.put(
  "/:id",
  protect,
  isAllowed([Role.ADMIN, Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  validators.updateShopValidator,
  controllers.updateShopHandler
);
// router.delete("/:id", protect, controllers.deleteShop);

// QR code management (authenticated)
router.post(
  "/:shopId/qr-code",
  protect,
  isAllowed([Role.ADMIN, Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  validators.validateRegenerateQRCode,
  controllers.regenerateQRCodeHandler
);

// Menu URL (authenticated)
router.get(
  "/:shopName/menu-url",
  protect,
  validators.validateGetMenuUrl,
  controllers.getMenuUrlHandler
);

// Admin endpoints
router.get("/", protect, isAllowed([Role.ADMIN]), controllers.getAllShops); // ADMIN ENDPOINT FOR NOW

// menu item routes

router.post(
  "/:shopId/menu-items",
  validateCreateMenuItem,
  createMenuItemAndAddToCategoryHandler
);

router.get(
  "/:shopId/menu-items/:itemId",
  validateGetOrDeleteItemById,
  getMenuItemByIdHandler
);

router.delete(
  "/:shopId/menu-items/:itemId",
  validateGetOrDeleteItemById,
  deleteMenuItemHandler
);

router.patch(
  "/:shopId/menu-items/:itemId/toggle",
  validateToggleAvailability,
  toggleItemAvailabilityHandler
);

//category routes

router.post(
  "/:shopId/categories",
  categoryParamValidators,
  createCategoryValidator,
  createCategoryHandler
);
router.get(
  "/:shopId/categories",
  categoryParamValidators,
  getCategoriesWithItemsByShopHandler
);
router.get(
  "/:shopId/categories/:categoryId",
  categoryParamValidators,
  categoryIdValidator,
  getCategoryByIdHandler
);
router.put(
  "/:shopId/categories/:categoryId",
  categoryParamValidators,
  categoryIdValidator,
  updateCategoryValidator,
  updateCategoryHandler
);
router.delete(
  "/:shopId/categories/:categoryId",
  categoryParamValidators,
  categoryIdValidator,
  deleteCategoryAndItemsHandler
);

router.put(
  "/:shopId/:categoryId/:itemId",
  categoryParamValidators,
  categoryIdValidator,
  updateItemInCategoryValidator,
  updateItemInCategoryController
);
router.get(
  "/:shopId/:categoryId",
  categoryParamValidators,
  categoryIdValidator,
  getItemsInCategoryHandler
);

// order routes

router.post("/:shopId/orders", validateCreateOrder, createOrderHandler);

router.put(
  "/:shopId/orders/:orderId/status",
  protect,
  isAllowed(["Cashier", "Admin"]),
  validateUpdateOrderStatus,
  updateOrderStatusHandler
);

router.put(
  "/:shopId/orders/:orderId/cancel",
  protect,
  isAllowed(["Cashier", "Admin"]),
  cancelledOrderHandler
);

router.get(
  "/:shopId/orders",
  protect,
  isAllowed(["Cashier", "Admin"]),
  getOrdersByShopHandler
);

router.get(
  "/:shopId/orders/:orderId",
  protect,
  isAllowed(["Cashier", "Admin"]),
  validateOrderId,
  getOrderByIdHandler
);

router.put(
  "/:shopId/orders/:orderId/sendToKitchen",
  protect,
  isAllowed(["Cashier", "Admin"]),
  sendOrderToKitchenHandler
);

// kitchen routes

router.get(
  "/:shopId/orders/kitchen",
  isAllowed(["Kitchen"]),
  getKitchenOrdersHandler
);

router.put(
  "/:shopId/orders/:orderId/kitchen/status",
  validateOrderId,
  isAllowed(["Kitchen"]),
  updateKitchenOrderStatusHandler
);

export default router;
