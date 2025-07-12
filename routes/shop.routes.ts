import express from "express";
import * as controllers from "../controllers/shop.controller";
import { protect } from "../middlewares/auth";
import { creatShopValidator } from "../validators/shop.validators";

const router = express.Router();

router.post("/", protect, creatShopValidator, controllers.createShop);
// router.get('/:id', controllers.getShopById);
router.put("/:id", controllers.updateShop);

router.delete("/:id", controllers.deleteShop);
router.get("/", controllers.getAllShops); //ADMIN ENDPONT FOR NOW

// get shopid/menu   -- returns category and menuITEMS
// router.get('/:id/menu', controllers.getShopMenu);

export default router;
