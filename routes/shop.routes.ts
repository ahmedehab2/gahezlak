import express from "express";
import * as controllers from "../controllers/shop.controller";
import { protect } from "../middlewares/auth";
import { creatShopValidator } from "../validators/shop.validators";

// menu items imports

import {
  createMenuItemAndAddToCategoryController,
  getMenuItemByIdController,
  deleteMenuItemController,
  toggleItemAvailabilityController
} from '../controllers/menu-item.controller';

import {
  validateCreateMenuItem,
  validateToggleAvailability,
  validateGetOrDeleteItemById
} from '../validators/menu-item.validator';

// category imports 

import {
  createCategoryController,
  getCategoriesWithItemsByShopController,
  updateCategoryController,
  deleteCategoryAndItemsController,
  updateItemInCategoryController,
  getItemsInCategoryController,
  getCategoryByIdController,
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
  CreateOrderController,
  CancelledOrderController,
  UpdateOrderStatusController,
  GetOrdersByShopController,
  GetOrderByIdController,
  SendOrderToKitchenController,
} from "../controllers/order.controller";
import {  isAllowed } from "../middlewares/auth";
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
} from "../validators/order.validator";

// kitchen imports

import {
  GetKitchenOrdersController,
  UpdateKitchenOrderStatusController,
} from "../controllers/kitchen.controller";

import { validateOrderId } from "../validators/order.validator";

const router = express.Router();

router.post("/", protect, creatShopValidator, controllers.createShop);
// router.get('/:id', controllers.getShopById);
router.put("/:id", controllers.updateShop);

router.delete("/:id", controllers.deleteShop);
router.get("/", controllers.getAllShops); //ADMIN ENDPONT FOR NOW

// get shopid/menu   -- returns category and menuITEMS
// router.get('/:id/menu', controllers.getShopMenu);



// menu item routes 

router.post('/:shopId/menu-items', validateCreateMenuItem, createMenuItemAndAddToCategoryController);

router.get('/:shopId/menu-items/:itemId', validateGetOrDeleteItemById, getMenuItemByIdController);

router.delete('/:shopId/menu-items/:itemId', validateGetOrDeleteItemById, deleteMenuItemController);

router.put('/:shopId/menu-items/:itemId/toggle', validateToggleAvailability, toggleItemAvailabilityController);

//category routes

router.post("/:shopId/categories", categoryParamValidators, createCategoryValidator, createCategoryController);
router.get("/:shopId/categories", categoryParamValidators, getCategoriesWithItemsByShopController);
router.get("/:shopId/categories/:categoryId", categoryParamValidators, categoryIdValidator, getCategoryByIdController);
router.put("/:shopId/categories/:categoryId", categoryParamValidators, categoryIdValidator, updateCategoryValidator, updateCategoryController);
router.delete("/:shopId/categories/:categoryId", categoryParamValidators, categoryIdValidator, deleteCategoryAndItemsController);

router.put(
  "/:shopId/:categoryId/:itemId",
  categoryParamValidators,
  categoryIdValidator,
  updateItemInCategoryValidator,
  updateItemInCategoryController
);
router.get("/:shopId/:categoryId", categoryParamValidators, categoryIdValidator, getItemsInCategoryController);


// order routes

router.post("/:shopId/orders", validateCreateOrder, CreateOrderController);

router.put(
  "/:shopId/orders/:orderId/status",
  protect,
  isAllowed(["Cashier", "Admin"]),
  validateUpdateOrderStatus,
  UpdateOrderStatusController
);
router.put(
  "/:shopId/orders/:orderId/cancel",
  protect,
  isAllowed(["Cashier", "Admin"]),
  CancelledOrderController
);
router.get(
  "/:shopId/orders",
  protect,
  isAllowed(["Cashier", "Admin"]),
  GetOrdersByShopController
);
router.get(
  "/:shopId/orders/:orderId",
  protect,
  isAllowed(["Cashier", "Admin"]),
  GetOrderByIdController
);
router.put(
  "/:shopId/orders/:orderId/sendToKitchen",
  protect,
  isAllowed(["Cashier", "Admin"]),
  SendOrderToKitchenController
);


// kitchen routes

router.get(
  "/:shopId/orders/kitchen",
  isAllowed(["Kitchen"]),
  GetKitchenOrdersController
);
router.put(
  "/:shopId/orders/:orderId/kitchen/status",
  validateOrderId,
  isAllowed(["Kitchen"]),
  UpdateKitchenOrderStatusController
);






export default router;
