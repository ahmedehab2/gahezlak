import express from "express";
import * as controllers from "../controllers/shop.controller";
import { protect } from "../middlewares/auth";
import { creatShopValidator,validateRegenerateQRCode, validateGetMenuUrl} from "../validators/shop.validators";

const router = express.Router();

// Shop management endpoints (authenticated)
router.post("/", protect, creatShopValidator, controllers.createShop);
router.put("/:id", protect, controllers.updateShop);
router.delete("/:id", protect, controllers.deleteShop);
// router.get('/:id', controllers.getShopById);
// QR code management (authenticated)
router.post("/:shopId/qr-code", protect,validateRegenerateQRCode, controllers.regenerateQRCodeHandler);

// Menu URL (authenticated)
router.get("/:shopName/menu-url", protect,validateGetMenuUrl, controllers.getMenuUrlHandler);


// Admin endpoints
router.get("/", protect, controllers.getAllShops); // ADMIN ENDPOINT FOR NOW

export default router;
