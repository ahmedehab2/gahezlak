import { RequestHandler } from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  // getItemsInCategory,
  // updateItemInCategory,
  getCategoryById,
  getCategoriesByShop,
} from "../services/category.service";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { ICategory } from "../models/Category";

export const createCategoryHandler: RequestHandler = async (req, res) => {
  const shopId = req.user?.shopId!;
  const categoryData = req.body;
  const category = await createCategory(shopId, categoryData);

  const response: SuccessResponse<typeof category> = {
    message: "Category created successfully",
    data: category,
  };

  res.status(201).json(response);
};

export const updateCategoryHandler: RequestHandler<
  { categoryId: string },
  SuccessResponse<ICategory>,
  Partial<ICategory>
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const categoryId = req.params.categoryId;
  const updateData = req.body;
  const updatedCategory = await updateCategory(shopId, categoryId, updateData);

  res.status(200).json({
    message: "Category updated successfully",
    data: updatedCategory,
  });
};

export const deleteCategoryHandler: RequestHandler<
  { categoryId: string },
  SuccessResponse<ICategory>,
  unknown
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const categoryId = req.params.categoryId;
  const deletedCategory = await deleteCategory(shopId, categoryId);

  res.status(200).json({
    message: "Category deleted successfully",
    data: deletedCategory,
  });
};

export const getCategoriesByShopHandler: RequestHandler<
  {
    shopName?: string;
  },
  SuccessResponse<ICategory[]>
> = async (req, res) => {
  const shopId = req.user?.shopId;
  const shopName = req.params.shopName;
  const lang = req.lang;

  const categories = await getCategoriesByShop({ shopId, shopName, lang });

  res.status(200).json({
    message: "Categories retrieved",
    data: categories,
  });
};


// export const updateItemInCategoryHandler: RequestHandler = async (req, res) => {
//   const { shopId, categoryId, itemId } = req.params;
//   const updateData = req.body;
//   const item = await updateItemInCategory(
//     shopId,
//     categoryId,
//     itemId,
//     updateData
//   );

//   const response: SuccessResponse<typeof item> = {
//     message: "Item in category updated successfully",
//     data: item,
//   };

//   res.status(200).json(response);
// };

// export const getItemsInCategoryHandler: RequestHandler = async (req, res) => {
//   const { shopId, categoryId } = req.params;
//   const lang = req.lang;
//   const items = await getItemsInCategory(shopId, categoryId, lang);

//   const response: SuccessResponse<typeof items> = {
//     message: "Items in category retrieved",
//     data: items,
//   };

//   res.status(200).json(response);
// };

export const getCategoryByIdHandler: RequestHandler<
  { categoryId: string },
  SuccessResponse<ICategory>
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const categoryId = req.params.categoryId;

  const category = await getCategoryById(shopId, categoryId);

  const response: SuccessResponse<typeof category> = {
    message: "Category retrieved",
    data: category,
  };

  res.status(200).json(response);
};
