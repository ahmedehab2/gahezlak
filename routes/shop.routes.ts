import express from "express";
import * as controllers from "../controllers/shop.controller";
import { isAllowed, protect } from "../middlewares/auth";
import * as shopValidators from "../validators/shop.validator";
import { Role } from "../models/Role";

// menu items imports

import * as menuItemControllers from "../controllers/menu-item.controller";

import * as menuItemValidators from "../validators/menu-item.validator";

// category imports

import * as categoryControllers from "../controllers/category.controller";

import * as categoryValidators from "../validators/category.validators";

// Order imports

import * as orderControllers from "../controllers/order.controller";
import * as orderValidators from "../validators/order.validator";

import { validateOrderId } from "../validators/order.validator";
import { uploadMiddleware } from "../middlewares/multer";

const router = express.Router();

router.post(
  "/",
  protect,
  shopValidators.creatShopValidator,
  controllers.createShopHandler
);
router.put(
  "/:shopId",
  protect,
  isAllowed([Role.ADMIN, Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  shopValidators.updateShopValidator,
  controllers.updateShopHandler
);
// router.delete("/:shopId", protect, controllers.deleteShop);

// QR code management (authenticated)
router.post(
  "/qr-code",
  protect,
  isAllowed([Role.ADMIN, Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  shopValidators.validateRegenerateQRCode,
  controllers.regenerateQRCodeHandler
);

// Menu URL (authenticated)
router.get(
  "/:shopName/menu-url",
  protect,
  shopValidators.shopNameParamValidator,
  controllers.getMenuUrlHandler
);

// Admin endpoints
router.get("/", protect, isAllowed([Role.ADMIN]), controllers.getAllShops); // ADMIN ENDPOINT FOR NOW

// menu item routes

router.post(
  "/menu-items",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  uploadMiddleware,
  menuItemValidators.validateCreateMenuItem,
  menuItemControllers.createMenuItemAndAddToCategoryHandler
);

router
  .get(
    "/menu-items/:itemId",
    menuItemValidators.validateGetOrDeleteItemById,
    menuItemControllers.getMenuItemByIdHandler
  )
  .delete(
    "/menu-items/:itemId",
    protect,
    isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
    menuItemValidators.validateGetOrDeleteItemById,
    menuItemControllers.deleteMenuItemHandler
  );

router.patch(
  "/menu-items/:itemId/toggle",
  menuItemValidators.validateToggleAvailability,
  menuItemControllers.toggleItemAvailabilityHandler
);

//get all menu items
//get all menuitems by shopname

//category routes

router.post(
  "/categories",
  protect,
  // isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  categoryValidators.createCategoryValidator,
  categoryControllers.createCategoryHandler
);

// for logged in shop workers
router.get(
  "/categories",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER, Role.SHOP_STAFF]),
  categoryControllers.getCategoriesByShopHandler
);

//for public usage (customers)
router.get(
  "/:shopName/categories",
  shopValidators.shopNameParamValidator,
  categoryControllers.getCategoriesByShopHandler
);

router
  .get(
    "/:shopId/categories/:categoryId",
    protect,
    categoryValidators.categoryIdValidator,
    categoryControllers.getCategoryByIdHandler
  )
  .put(
    "/categories/:categoryId",
    protect,
    isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
    categoryValidators.updateCategoryValidator,
    categoryControllers.updateCategoryHandler
  )
  .delete(
    "/categories/:categoryId",
    protect,
    isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
    categoryValidators.categoryIdValidator,
    categoryControllers.deleteCategoryHandler
  );

// router.put(
//   "/:shopId/:categoryId/:itemId",
//   categoryValidators.categoryParamValidators,
//   categoryValidators.categoryIdValidator,
//   categoryValidators.updateItemInCategoryValidator,
//   categoryControllers.updateItemInCategoryHandler
// );
// router.get(
//   "/:shopId/:categoryId",
//   categoryValidators.categoryParamValidators,
//   categoryValidators.categoryIdValidator,
//   categoryControllers.getItemsInCategoryHandler
// );

// order routes

router.post(
  "/:shopId/orders",
  orderValidators.validateCreateOrder,
  orderControllers.createOrderHandler
);

router.put(
  "/:shopId/orders/:orderId/status",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  orderValidators.validateUpdateOrderStatus,
  orderControllers.updateOrderStatusHandler
);

router.get(
  "/:shopId/orders",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  orderControllers.getOrdersByShopHandler
);

router.get(
  "/:shopId/orders/:orderId",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  validateOrderId,
  orderControllers.getOrderByIdHandler
);

router.put(
  "/:shopId/orders/:orderId/sendToKitchen",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  orderControllers.sendOrderToKitchenHandler
);

router.get(
  "/:shopId/orders/kitchen",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER, Role.SHOP_STAFF]),
  orderControllers.getKitchenOrdersHandler
);

export default router;
