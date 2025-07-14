import { RequestHandler } from "express";
import {
  createMenuItemAndAddToCategory,
  deleteMenuItem,
  getMenuItemById,
  toggleItemAvailability,
} from "../services/menu-item.service";
import { SuccessResponse } from "../common/types/contoller-response.types";

export const createMenuItemAndAddToCategoryHandler: RequestHandler = async (
  req,
  res
) => {
  const { shopId, categoryId } = req.params;
  const data = req.body;
  const item = await createMenuItemAndAddToCategory(shopId, data, categoryId);

  const response: SuccessResponse<typeof item> = {
    message: "Menu item created and added to category",
    data: item,
  };

  res.status(201).json(response);
};

export const getMenuItemByIdHandler: RequestHandler = async (req, res) => {
  const { shopId, itemId } = req.params;
  const item = await getMenuItemById(shopId, itemId);

  const response: SuccessResponse<typeof item> = {
    message: "Menu item retrieved",
    data: item,
  };

  res.status(200).json(response);
};

export const deleteMenuItemHandler: RequestHandler = async (req, res) => {
  const { shopId, itemId } = req.params;
  const deleted = await deleteMenuItem(shopId, itemId);

  const response: SuccessResponse<typeof deleted> = {
    message: "Menu item deleted",
    data: deleted,
  };

  res.status(200).json(response);
};

export const toggleItemAvailabilityHandler: RequestHandler = async (
  req,
  res
) => {
  const { shopId, itemId } = req.params;
  const item = await toggleItemAvailability(shopId, itemId);

  const response: SuccessResponse<typeof item> = {
    message: "Item availability toggled",
    data: item,
  };

  res.status(200).json(response);
};
