import express from "express";
import * as controllers from "../controllers/shop.controller";
import { isAllowed, protect } from "../middlewares/auth";
import * as validators from "../validators/shop.validator";
import { Role } from "../models/Role";

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

export default router;
