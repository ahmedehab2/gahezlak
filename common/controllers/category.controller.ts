import { Request, Response, NextFunction } from 'express';
import {
  createCategory,
  getCategoriesWithItemsByShop,
  updateCategory,
  deleteCategoryAndItems,
  getItemsInCategory,
  updateItemInCategory,
  getCategoryById
} from '../services/category.service';

import { SuccessResponse } from '../types/contoller-response.types';

export const createCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const categoryData = req.body;
    const category = await createCategory(shopId, categoryData);

    const response: SuccessResponse<typeof category> = {
      message: req.lang === 'ar' ? 'تم إنشاء الفئة' : 'Category created',
      data: category
    };

    res.status(201).json(response);
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
      message: req.lang === 'ar' ? 'تم تحديث الفئة' : 'Category updated',
      data: updatedCategory
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryAndItemsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const categoryId = req.params.categoryId;
    const deleted = await deleteCategoryAndItems(shopId, categoryId);

    const response: SuccessResponse<typeof deleted> = {
      message: req.lang === 'ar' ? 'تم حذف الفئة وعناصرها بنجاح' : 'Category deleted successfully',
      data: deleted
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCategoriesWithItemsByShopController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const categories = await getCategoriesWithItemsByShop(shopId, req.lang);

    const response: SuccessResponse<typeof categories> = {
      message: req.lang === 'ar' ? 'تم استرجاع الفئات مع العناصر' : 'Categories with items retrieved',
      data: categories
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateItemInCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, categoryId, itemId } = req.params;
    const updateData = req.body;
    const updatedItem = await updateItemInCategory(shopId, categoryId, itemId, updateData);

    const response: SuccessResponse<typeof updatedItem> = {
      message: req.lang === 'ar' ? 'تم تحديث العنصر في الفئة' : 'Item updated in category',
      data: updatedItem
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getItemsInCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, categoryId } = req.params;
    const items = await getItemsInCategory(shopId, categoryId, req.lang);

    const response: SuccessResponse<typeof items> = {
      message: req.lang === 'ar' ? 'تم استرجاع العناصر في الفئة' : 'Items in category retrieved',
      data: items
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, categoryId } = req.params;
    const category = await getCategoryById(shopId, categoryId);

    const response: SuccessResponse<typeof category> = {
      message: req.lang === 'ar' ? 'تم استرجاع الفئة' : 'Category retrieved',
      data: category
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
