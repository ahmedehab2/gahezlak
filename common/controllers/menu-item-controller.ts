import {
  deleteMenuItem,
  getItemsByShop,
  getMenuItemById,
  updateMenuItem,
  createMenuItem,
  getMenuItemsByCategory,
  toggleItemAvailability
} from "../services/menu-item.service";
import { Request, Response, NextFunction } from "express";
import { SuccessResponse, PaginatedRespone } from '../types/contoller-response.types';

export const createMenuItemController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const menuItemData = req.body;
    const newMenuItem = await createMenuItem(shopId, menuItemData);

    const response: SuccessResponse<typeof newMenuItem> = {
      message: "Menu item created successfully",
      data: newMenuItem
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
    const menuItem = await getMenuItemById(shopId, itemId);
    const response: SuccessResponse<typeof menuItem> = {
      message: "Menu item retrieved successfully",
      data: menuItem
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getItemsByShopController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const items = await getItemsByShop(shopId);
    const response: SuccessResponse<typeof items> = {
      message: "Menu items retrieved successfully",
      data: items
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateMenuItemController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const itemId = req.params.itemId;
    const updateData = req.body;
    const updatedMenuItem = await updateMenuItem(shopId, itemId, updateData);
    const response: SuccessResponse<typeof updatedMenuItem> = {
      message: "Menu item updated successfully",
      data: updatedMenuItem
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
    const response: SuccessResponse<typeof deletedMenuItem> = {
      message: "Menu item deleted successfully",
      data: deletedMenuItem
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getMenuItemByCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const category = req.params.category;
    const menuItems = await getMenuItemsByCategory(shopId, category);
    const response: SuccessResponse<typeof menuItems> = {
      message: "Menu items by category retrieved successfully",
      data: menuItems
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
    const response: SuccessResponse<typeof updatedMenuItem> = {
      message: "Menu item availability toggled successfully",
      data: updatedMenuItem
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

