import { RequestHandler } from "express";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItemsByShop,
  toggleItemAvailability,
  updateMenuItem,
} from "../services/menu-item.service";
import { SuccessResponse,PaginatedRespone } from "../common/types/contoller-response.types";
import { IMenuItem } from "../models/MenuItem";
import uploadToImgbb from "../utils/uploadToImgbb";

export const createMenuItemAndAddToCategoryHandler: RequestHandler<
  unknown,
  SuccessResponse<IMenuItem>,
  Pick<
    IMenuItem,
    | "name"
    | "description"
    | "price"
    | "categoryId"
    | "imgUrl"
    | "discountPercentage"
    | "options"
    | "isAvailable"
  >
> = async (req, res, next) => {
  const shopId = req.user?.shopId!;
  let imageUrl: string | undefined;

  if (req.file) {
    const uploadResult = await uploadToImgbb(req.file);
    imageUrl = uploadResult?.data?.url;
  }

  const item = await createMenuItem(shopId, {
    ...req.body,
    ...(imageUrl && { imgUrl: imageUrl }),
  });

  res.status(201).json({
    message: "Menu item created successfully",
    data: item,
  });
};

export const getMenuItemByIdHandler: RequestHandler<
  { itemId: string },
  SuccessResponse<IMenuItem>,
  unknown,
  { lang: "en" | "ar" }
> = async (req, res) => {
  const itemId = req.params.itemId;
  const shopId = req.user?.shopId!;

  const item = await getMenuItemById(shopId, itemId, req.lang);

  res.status(200).json({
    message: "Menu item retrieved",
    data: item,
  });
};

export const deleteMenuItemHandler: RequestHandler<
  { itemId: string },
  SuccessResponse<IMenuItem>,
  unknown
> = async (req, res) => {
  const itemId = req.params.itemId;
  const shopId = req.user?.shopId!;
  const deleted = await deleteMenuItem(shopId, itemId);

  res.status(200).json({
    message: "Menu item deleted",
    data: deleted,
  });
};

export const toggleItemAvailabilityHandler: RequestHandler<
  { itemId: string },
  SuccessResponse<IMenuItem>,
  { isAvailable: boolean }
> = async (req, res) => {
  const { itemId } = req.params;
  const shopId = req.user?.shopId!;
  const { isAvailable } = req.body;
  const item = await toggleItemAvailability(shopId, itemId, isAvailable);

  res.status(200).json({
    message: "Item availability toggled",
    data: item,
  });
};

export const updateMenuItemHandler: RequestHandler<
  { shopId: string; itemId: string },
  SuccessResponse<IMenuItem>,
  Partial<IMenuItem>
> = async (req, res, next) => {
  const { itemId } = req.params;
  const shopId = req.user?.shopId!;
  let imageUrl: string | undefined;

  if (req.file) {
    const uploadResult = await uploadToImgbb(req.file);
    imageUrl = uploadResult?.data?.url;
  }

  const updatedItem = await updateMenuItem(shopId, itemId, {
    ...req.body,
    ...(imageUrl && { imgUrl: imageUrl }),
  });

  res.status(200).json({
    message: "Menu item updated successfully",
    data: updatedItem,
  });
};



export const getMenuItemsByShopHandler: RequestHandler<
  { shopName?: string },
  SuccessResponse<IMenuItem[]>
> = async (req, res) => {
  const shopId = req.user?.shopId;
  const shopName = req.params.shopName;
  const lang = req.lang;

  // const page = parseInt(req.query.page as string) || 1;
  // const limit = parseInt(req.query.limit as string) || 10;
  // const skip = (page - 1) * limit;

  //const search = req.query.search as string | undefined;  
  const  items  = await getMenuItemsByShop({
    shopId,
    shopName,
    lang,
    // skip,
    // limit,
    //search,
  });

  // const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    message: "MenuItems retrieved",
    data: items,
    //total: totalCount,
    // page,
    // totalPages,
  });
};


