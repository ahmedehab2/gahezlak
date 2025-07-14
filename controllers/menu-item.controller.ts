import { RequestHandler } from 'express';
import {
  createMenuItemAndAddToCategory,
  deleteMenuItem,
  getMenuItemById,
  toggleItemAvailability
} from '../services/menu-item.service';
import { SuccessResponse } from '../common/types/contoller-response.types';

export const createMenuItemAndAddToCategoryController: RequestHandler = async (req, res) => {
  const {shopId,categoryId} = req.params;
  const data = req.body;
  const item = await createMenuItemAndAddToCategory(shopId, data,categoryId);

  const response: SuccessResponse<typeof item> = {
    message: 'Menu item created and added to category',
    data: item
  };

  res.status(201).json(response);
};

export const getMenuItemByIdController: RequestHandler = async (req, res) => {
  const { shopId, itemId } = req.params;
  const item = await getMenuItemById(shopId, itemId, req.lang);

  const response: SuccessResponse<typeof item> = {
    message: 'Menu item retrieved successfully',
    data: item
  };

  res.status(200).json(response);
};

export const deleteMenuItemController: RequestHandler = async (req, res) => {
  const { shopId, itemId } = req.params;
  const result = await deleteMenuItem(shopId, itemId);

  const response: SuccessResponse<typeof result> = {
    message: 'Menu item deleted successfully',
    data: result
  };

  res.status(200).json(response);
};

export const toggleItemAvailabilityController: RequestHandler = async (req, res) => {
  const { shopId, itemId } = req.params;
  const isAvailable = req.body.isAvailable;
  const updatedItem = await toggleItemAvailability(shopId, itemId, isAvailable);

  const response: SuccessResponse<typeof updatedItem> = {
    message: 'Item availability toggled successfully',
    data: updatedItem
  };

  res.status(200).json(response);
};
