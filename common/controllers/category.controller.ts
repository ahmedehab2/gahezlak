
import { Request, Response, NextFunction } from 'express';
import {
  createCategory,
  getCategoriesByShop,
  updateCategory,
  deleteCategory
} from '../services/category.service';

import { SuccessResponse, PaginatedRespone } from '../types/contoller-response.types';

export const createCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const categoryData = req.body;
    const category = await createCategory(shopId, categoryData);

    const response: SuccessResponse<typeof category> = {
      message: 'Category created',
      data: category
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCategoriesByShopController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const categories = await getCategoriesByShop(shopId);

    const response: SuccessResponse<typeof categories> = {
      message: 'Categories retrieved',
      data: categories
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const categoryId = req.params.categoryId;
    const updateData = req.body;
    const updatedCategory = await updateCategory(shopId, categoryId, updateData);

    const response: SuccessResponse<typeof updatedCategory> = {
      message: 'Category updated',
      data: updatedCategory
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const categoryId = req.params.categoryId;
    const deletedCategory = await deleteCategory(shopId, categoryId);

    const response: SuccessResponse<typeof deletedCategory> = {
      message: 'Category deleted successfully',
      data: deletedCategory
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
