import express from "express";
import * as controllers from "../controllers/shop.controller";
import { isAllowed, protect } from "../middlewares/auth";
import {
  isShopOwner,
  isShopMember,
} from "../middlewares/shop-member-check.middleware";
import * as shopValidators from "../validators/shop.validator";
import { Role } from "../models/Role";

// menu items imports

import * as menuItemControllers from "../controllers/menu-item.controller";

// category imports

import * as categoryControllers from "../controllers/category.controller";

import * as categoryValidators from "../validators/category.validators";

// Order imports

import * as orderControllers from "../controllers/order.controller";
import * as orderValidators from "../validators/order.validator";
import * as menuItemValidators from "../validators/menu-item.validator";

import { validateOrderId } from "../validators/order.validator";
import { uploadMiddleware } from "../middlewares/multer";

const router = express.Router();

//  /shops routes

// --- Admin Endpoints ---
// Specific static routes should come before dynamic routes
router.get("/", protect, isAllowed([Role.ADMIN]), controllers.getAllShops); // ADMIN ENDPOINT FOR NOW

// --- Shop Creation ---
router.post(
  "/",
  protect,
  uploadMiddleware("logo"), // handle logo image upload
  shopValidators.creatShopValidator,
  controllers.createShopHandler
);

// --- Shop Member Management ---
// These routes have a dynamic :shopId but are more specific than general shop GET/PUT
router
  .route("/:shopId/members")
  .post(
    protect,
    isAllowed([Role.SHOP_OWNER]),
    shopValidators.addMemberValidator,
    isShopOwner,
    controllers.addMemberHandler
  )
  .get(
    protect,
    isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
    shopValidators.shopIdValidator,
    isShopMember,
    controllers.getShopMembersHandler
  );

router.delete(
  "/:shopId/members/:userId",
  protect,
  isAllowed([Role.SHOP_OWNER]),
  shopValidators.removeMemberValidator,
  isShopOwner,
  controllers.removeMemberHandler
);

router.put(
  "/:shopId/members/:userId",
  protect,
  isAllowed([Role.SHOP_OWNER]),
  shopValidators.updateMemberRoleValidator,
  isShopOwner,
  controllers.updateMemberRoleHandler
);

// --- QR Code Management ---
router.post(
  "/qr-code",
  protect,
  isAllowed([Role.ADMIN, Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  shopValidators.validateRegenerateQRCode,
  isShopMember,
  controllers.regenerateQRCodeHandler
);

// --- Subscription Management ---
router.post(
  "/subscription/cancel",
  protect,
  isAllowed([Role.SHOP_OWNER]),
  isShopMember,
  controllers.cancelShopSubscriptionHandler
);

// --- Public Shop Routes ---
// Using `/name/:shopName` to be specific and avoid conflict with `/id/:shopId`
router.get(
  "/name/:shopName",
  shopValidators.shopNameParamValidator,
  controllers.getShopHandler
);

// For public usage (customers)
router.get(
  "/name/:shopName/menu-items",
  shopValidators.shopNameParamValidator,
  menuItemControllers.getMenuItemsByShopHandler
);

//for public usage (customers)
router.get(
  "/name/:shopName/categories",
  shopValidators.shopNameParamValidator,
  categoryControllers.getCategoriesByShopHandler
);

// --- Authenticated Shop Routes ---
// Using `/id/:shopId` to be specific for authenticated actions
router.get(
  "/id/:shopId",
  protect,
  isAllowed([
    Role.SHOP_OWNER,
    Role.SHOP_MANAGER,
    Role.SHOP_STAFF,
    Role.KITCHEN,
  ]),
  shopValidators.shopIdValidator,
  isShopMember,
  controllers.getShopHandler
);

router.put(
  "/id/:shopId",
  protect,
  isAllowed([Role.ADMIN, Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  shopValidators.updateShopValidator,
  uploadMiddleware("logo"), // handle logo image upload
  isShopMember,
  controllers.updateShopHandler
);

// --- Menu Item Routes (Authenticated) ---
// These routes are for logged-in users and don't need a /:shopId because
// isShopMember middleware should handle getting the shop context.
router.post(
  "/menu-items",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  uploadMiddleware("image"), // handle image upload for menu item
  menuItemValidators.validateCreateMenuItem,
  isShopMember,
  menuItemControllers.createMenuItemAndAddToCategoryHandler
);

router.get(
  "/menu-items",
  protect,
  isAllowed([
    Role.SHOP_OWNER,
    Role.SHOP_MANAGER,
    Role.SHOP_STAFF,
    Role.KITCHEN,
  ]),
  isShopMember,
  menuItemControllers.getMenuItemsByShopHandler
);

router.get(
  "/menu-items/:itemId",
  protect,
  isAllowed([
    Role.SHOP_OWNER,
    Role.SHOP_MANAGER,
    Role.SHOP_STAFF,
    Role.KITCHEN,
  ]),
  menuItemValidators.validateGetOrDeleteItemById,
  isShopMember,
  menuItemControllers.getMenuItemByIdHandler
);

router.delete(
  "/menu-items/:itemId",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  menuItemValidators.validateGetOrDeleteItemById,
  isShopMember,
  menuItemControllers.deleteMenuItemHandler
);

router.patch(
  "/menu-items/:itemId/toggle",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  menuItemValidators.validateToggleAvailability,
  isShopMember,
  menuItemControllers.toggleItemAvailabilityHandler
);

router.patch(
  "/menu-items/:itemId",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  menuItemValidators.validateUpdateMenuItem,
  uploadMiddleware("image"),
  isShopMember,
  menuItemControllers.updateMenuItemHandler
);

// --- Category Routes (Authenticated) ---
router.post(
  "/categories",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  categoryValidators.createCategoryValidator,
  isShopMember,
  categoryControllers.createCategoryHandler
);

router.get(
  "/categories",
  protect,
  isAllowed([
    Role.SHOP_OWNER,
    Role.SHOP_MANAGER,
    Role.SHOP_STAFF,
    Role.KITCHEN,
  ]),
  isShopMember,
  categoryControllers.getCategoriesByShopHandler
);

router
  .get(
    "/categories/:categoryId",
    protect,
    isAllowed([
      Role.SHOP_OWNER,
      Role.SHOP_MANAGER,
      Role.SHOP_STAFF,
      Role.KITCHEN,
    ]),
    categoryValidators.categoryIdValidator,
    isShopMember,
    categoryControllers.getCategoryByIdHandler
  )
  .put(
    "/categories/:categoryId",
    protect,
    isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
    categoryValidators.updateCategoryValidator,
    isShopMember,
    categoryControllers.updateCategoryHandler
  )
  .delete(
    "/categories/:categoryId",
    protect,
    isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
    categoryValidators.categoryIdValidator,
    isShopMember,
    categoryControllers.deleteCategoryHandler
  );

// --- Order Routes ---

// Public route to get order by number
// It's placed before authenticated order routes
router.get(
  "/orders/number/:orderNumber",
  orderValidators.validateOrderNumber,
  orderControllers.getOrderDetailsByNumberHandler
);

router
  .post(
    "/orders",
    orderValidators.validateCreateOrder,
    orderControllers.createOrderHandler
  )
  .get(
    "/orders",
    protect,
    isAllowed([
      Role.SHOP_OWNER,
      Role.SHOP_MANAGER,
      Role.SHOP_STAFF,
      Role.KITCHEN,
    ]),
    isShopMember,
    orderControllers.getOrdersByShopHandler
  );

// Using `/id/:orderId` to distinguish from the `/number/:orderNumber` route
router.get(
  "/orders/id/:orderId",
  protect,
  isAllowed([
    Role.SHOP_OWNER,
    Role.SHOP_MANAGER,
    Role.SHOP_STAFF,
    Role.KITCHEN,
  ]),
  validateOrderId,
  isShopMember,
  orderControllers.getOrderByIdHandler
);

router.put(
  "/orders/:orderId/status",
  protect,
  isAllowed([Role.SHOP_OWNER, Role.SHOP_MANAGER]),
  orderValidators.validateUpdateOrderStatus,
  isShopMember,
  orderControllers.updateOrderStatusHandler
);

export default router;
