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

router.post('/:id', validateCreateMenuItem, createMenuItemAndAddToCategoryController);

router.get('/:id/:itemId', validateGetOrDeleteItemById, getMenuItemByIdController);

router.delete('/:id/:itemId', validateGetOrDeleteItemById, deleteMenuItemController);

router.patch('/:id/:itemId/toggle', validateToggleAvailability, toggleItemAvailabilityController);

//category routes

router.post("/:id", categoryParamValidators, createCategoryValidator, createCategoryController);
router.get("/:id", categoryParamValidators, getCategoriesWithItemsByShopController);
router.get("/:id/:categoryId", categoryParamValidators, categoryIdValidator, getCategoryByIdController);
router.put("/:id/:categoryId", categoryParamValidators, categoryIdValidator, updateCategoryValidator, updateCategoryController);
router.delete("/:id/:categoryId", categoryParamValidators, categoryIdValidator, deleteCategoryAndItemsController);

// Category Items routes
router.put(
  "/:id/:categoryId/items/:itemId",
  categoryParamValidators,
  categoryIdValidator,
  updateItemInCategoryValidator,
  updateItemInCategoryController
);
router.get("/:id/:categoryId/items", categoryParamValidators, categoryIdValidator, getItemsInCategoryController);


// order routes

router.post("/", validateCreateOrder, CreateOrderController);
router.put(
  "/:id/status",
  protect,
  isAllowed(["Cashier", "Admin"]),
  validateUpdateOrderStatus,
  UpdateOrderStatusController
);
router.put(
  "/:id/cancel",
  protect,
  isAllowed(["Cashier", "Admin"]),
  CancelledOrderController
);
router.get(
  "/shop/:shopId",
  protect,
  isAllowed(["Cashier", "Admin"]),
  GetOrdersByShopController
);
router.get(
  "/:id",
  protect,
  isAllowed(["Cashier", "Admin"]),
  GetOrderByIdController
);
router.put(
  "/:id/sendToKitchen",
  protect,
  isAllowed(["Cashier", "Admin"]),
  SendOrderToKitchenController
);


// kitchen routes

router.get(
  "/kitchen/orders",
  isAllowed(["Kitchen"]),
  GetKitchenOrdersController
);
router.put(
  "/kitchen/orders/:id/status",
  validateOrderId,
  isAllowed(["Kitchen"]),
  UpdateKitchenOrderStatusController
);






export default router;
