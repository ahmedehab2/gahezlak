import { RequestHandler } from "express";
import {
  createCategory,
  getCategoriesWithItemsByShop,
  updateCategory,
  deleteCategoryAndItems,
  getItemsInCategory,
  updateItemInCategory,
  getCategoryById,
} from "../services/category.service";
import { SuccessResponse } from "../common/types/contoller-response.types";

export const createCategoryHandler: RequestHandler = async (req, res) => {
  const shopId = req.params.shopId;
  const categoryData = req.body;
  const category = await createCategory(shopId, categoryData);

  const response: SuccessResponse<typeof category> = {
    message: "Category created successfully",
    data: category,
  };

  res.status(201).json(response);
};

export const updateCategoryHandler: RequestHandler = async (req, res) => {
  const shopId = req.params.shopId;
  const categoryId = req.params.categoryId;
  const updateData = req.body;
  const updatedCategory = await updateCategory(shopId, categoryId, updateData);

  const response: SuccessResponse<typeof updatedCategory> = {
    message: "Category updated successfully",
    data: updatedCategory,
  };

  res.status(200).json(response);
};

export const deleteCategoryAndItemsHandler: RequestHandler = async (
  req,
  res
) => {
  const shopId = req.params.shopId;
  const categoryId = req.params.categoryId;
  const deleted = await deleteCategoryAndItems(shopId, categoryId);

  const response: SuccessResponse<typeof deleted> = {
    message: "Category and its items deleted successfully",
    data: deleted,
  };

  res.status(200).json(response);
};

export const getCategoriesWithItemsByShopHandler: RequestHandler = async (
  req,
  res
) => {
  const shopId = req.params.shopId;
  const lang = req.lang;
  const categories = await getCategoriesWithItemsByShop(shopId, lang);

  const response: SuccessResponse<typeof categories> = {
    message: "Categories with items retrieved",
    data: categories,
  };

  res.status(200).json(response);
};

export const updateItemInCategoryHandler: RequestHandler = async (req, res) => {
  const { shopId, categoryId, itemId } = req.params;
  const updateData = req.body;
  const updatedItem = await updateItemInCategory(
    shopId,
    categoryId,
    itemId,
    updateData
  );

  const response: SuccessResponse<typeof updatedItem> = {
    message: "Item updated in category",
    data: updatedItem,
  };

  res.status(200).json(response);
};

export const getItemsInCategoryHandler: RequestHandler = async (req, res) => {
  const { shopId, categoryId } = req.params;
  const lang = req.lang;
  const items = await getItemsInCategory(shopId, categoryId, lang);

  const response: SuccessResponse<typeof items> = {
    message: "Items in category retrieved",
    data: items,
  };

  res.status(200).json(response);
};

export const getCategoryByIdHandler: RequestHandler = async (req, res) => {
  const { shopId, categoryId } = req.params;
  const category = await getCategoryById(shopId, categoryId);

  const response: SuccessResponse<typeof category> = {
    message: "Category retrieved",
    data: category,
  };

  res.status(200).json(response);
};
