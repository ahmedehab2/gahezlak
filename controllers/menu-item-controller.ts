import {
  deleteMenuItem,
  getMenuItemById,
  createMenuItemAndAddToCategory,
  toggleItemAvailability
} from "../services/menu-item.service";
import { Request, Response, NextFunction } from "express";
import { SuccessResponse } from '../common/types/contoller-response.types';
import { buildLocalizedMenuItem } from "../utils/menu-item-utils";


export const createMenuItemAndAddToCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const categoryId = req.params.categoryId; 
    const menuItemData = req.body;

    const newMenuItem = await createMenuItemAndAddToCategory(shopId, menuItemData, categoryId);

    const response: SuccessResponse<any> = {
      message: req.lang === 'ar' ? 'تم إنشاء عنصر المينيو وإضافته إلى الفئة بنجاح' : "Menu item created and added to category successfully",
      data: buildLocalizedMenuItem(newMenuItem, req.lang)
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getMenuItemByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const itemId = req.params.itemId;
    const lang = req.lang;
    const menuItem = await getMenuItemById(shopId, itemId,lang);

    const response: SuccessResponse<any> = {
      message: req.lang === 'ar' ? 'تم استرجاع العنصر بنجاح' : "Menu item retrieved successfully",
      data: buildLocalizedMenuItem(menuItem, req.lang)
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItemController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const itemId = req.params.itemId;
    const deletedMenuItem = await deleteMenuItem(shopId, itemId);

    const response: SuccessResponse<any> = {
      message: req.lang === 'ar' ? 'تم حذف العنصر بنجاح' : "Menu item deleted successfully",
      data: deletedMenuItem
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const toggleItemAvailabilityController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const itemId = req.params.itemId;
    const isAvailable = req.body.isAvailable;
    const updatedMenuItem = await toggleItemAvailability(shopId, itemId, isAvailable);

    const response: SuccessResponse<any> = {
      message: req.lang === 'ar' ? 'تم تحديث حالة توفر العنصر بنجاح' : "Menu item availability toggled successfully",
      data: buildLocalizedMenuItem(updatedMenuItem, req.lang)
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
