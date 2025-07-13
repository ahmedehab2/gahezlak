import { Router } from "express";
import {
  createCategoryController,
  getCategoriesWithItemsByShopController,
  updateCategoryController,
  deleteCategoryAndItemsController,
  updateItemInCategoryController,
  getItemsInCategoryController,
  getCategoryByIdController,
} from "../controllers/category.controller";

const router = Router();

router.post("/:shopId", createCategoryController);
router.get("/:shopId", getCategoriesWithItemsByShopController);
router.get("/:shopId/:categoryId", getCategoryByIdController);
router.put("/:shopId/:categoryId", updateCategoryController);
router.delete("/:shopId/:categoryId", deleteCategoryAndItemsController);

// Category Items routes
router.put(
  "/:shopId/:categoryId/items/:itemId",
  updateItemInCategoryController
);
router.get("/:shopId/:categoryId/items", getItemsInCategoryController);

export default router;
