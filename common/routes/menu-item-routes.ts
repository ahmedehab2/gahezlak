import { validateCreateMenuItem, validateUpdateMenuItem } from "../../validators/menu-item.validation";
import { createMenuItemController, deleteMenuItemController, getItemsByShopController, getMenuItemByIdController, getMenuItemByCategoryController, updateMenuItemController, toggleItemAvailabilityController } from "../controllers/menu-item-controller";
import { Router } from "express";


const router = Router();

router.post("/:shopId",validateCreateMenuItem ,createMenuItemController);
router.get("/:shopId/:itemId", getMenuItemByIdController);
router.get("/:shopId", getItemsByShopController);
router.get("/:shopId/category/:category", getMenuItemByCategoryController);
router.put("/:shopId/:itemId", validateUpdateMenuItem,updateMenuItemController);
router.delete("/:shopId/:itemId", deleteMenuItemController);
router.put("/:shopId/:itemId/toggle-availability", toggleItemAvailabilityController);

export default router;