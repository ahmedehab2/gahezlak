import express from "express";
import * as controllers from "../controllers/shop.controller";
import { isAllowed, protect, isShopOwner } from "../middlewares/auth";
import * as shopValidators from "../validators/shop.validator";
import { Role } from "../models/Role";

// menu items imports

import * as menuItemControllers from "../controllers/menu-item.controller";
import { updateMenuItemHandler } from "../controllers/menu-item.controller";
import { validateUpdateMenuItem } from "../validators/menu-item.validator";

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
  uploadMiddleware("logo"), // handle logo image upload
  shopValidators.creatShopValidator,
  controllers.createShopHandler
);
router.put(
  "/:shopId",
  protect,
  uploadMiddleware("logo"), // handle logo image upload
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

// Admin endpoints
router.get("/", protect, isAllowed([Role.ADMIN]), controllers.getAllShops); // ADMIN ENDPOINT FOR NOW

// menu item routes

router.post(
  "/menu-items",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  uploadMiddleware("image"), // handle image upload for menu item
  menuItemControllers.createMenuItemAndAddToCategoryHandler
);

// For logged in shop workers
router.get(
  "/menu-items",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER, Role.SHOP_STAFF]),
  menuItemControllers.getMenuItemsByShopHandler
);

// For public usage (customers)
router.get(
  "/:shopName/menu-items",
  shopValidators.shopNameParamValidator,
  menuItemControllers.getMenuItemsByShopHandler
);

// Get menu item by id (for logged in shop workers)
router.get(
  "/menu-items/:itemId",
  protect,  
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER, Role.SHOP_STAFF]),
  menuItemControllers.getMenuItemByIdHandler
);

// Delete menu item by id (for logged in shop workers)
router.delete(
  "/menu-items/:itemId",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  menuItemControllers.deleteMenuItemHandler
);

router.patch(
  "/menu-items/:itemId/toggle",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  menuItemControllers.toggleItemAvailabilityHandler
);

router.put(
  "/:shopId/menu-items/:itemId",
  protect,
  uploadMiddleware("image"), // handle image upload for menu item update
  validateUpdateMenuItem,
  updateMenuItemHandler
);

// category routes

router.post(
  "/categories",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
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
    "/categories/:categoryId",
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

router.get(
  "/:shopId/orders/kitchen",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER, Role.SHOP_STAFF]),
  orderControllers.getKitchenOrdersHandler
);

router.put(
  "/orders/:orderId/status",
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

// subscription routes
router.post(
  "/subscription/cancel",
  protect,
  isAllowed([Role.SHOP_OWNER]),
  controllers.cancelShopSubscriptionHandler
);

// Shop member management routes
router.post(
  "/:shopId/members",
  protect,
  isShopOwner,
  shopValidators.addMemberValidator,
  controllers.addMemberHandler
);

router.delete(
  "/:shopId/members/:userId",
  protect,
  isShopOwner,
  shopValidators.removeMemberValidator,
  controllers.removeMemberHandler
);

router.put(
  "/:shopId/members/:userId",
  protect,
  isShopOwner,
  shopValidators.updateMemberRoleValidator,
  controllers.updateMemberRoleHandler
);

export default router;
