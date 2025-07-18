import { RequestHandler } from "express";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItemsByShop,
  toggleItemAvailability,
} from "../services/menu-item.service";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { IMenuItem } from "../models/MenuItem";
import uploadToImgbb from "../utils/uploadToImgbb";
import { getUserShop } from "../services/shop.service";
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
    | "discount"
    | "options"
    | "isAvailable"
  >
> = async (req, res, next) => {
  const shopId = req.user?.shopId!;
  await getUserShop(req.user?.userId!); // make sure the req.user is member of the shop

  let imageUrl: string | undefined;
  if (req.file) {
    imageUrl = await uploadToImgbb(req.file);
  }

  const item = await createMenuItem(shopId, {
    ...req.body,
    imgUrl: imageUrl,
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
  const  itemId = req.params.itemId;
  const shopId = req.user?.shopId!;
  const lang = req.lang;
  const item = await getMenuItemById(shopId, itemId, lang);

  res.status(200).json({
    message: "Menu item retrieved",
    data: item as unknown as IMenuItem, // TODO: fix this
  });
};

export const deleteMenuItemHandler: RequestHandler = async (req, res) => {
  const  itemId  = req.params.itemId;
  const shopId = req.user?.shopId!;
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
  const { itemId } = req.params;
  const shopId = req.user?.shopId!;
  const { isAvailable } = req.body;
  const item = await toggleItemAvailability(shopId, itemId, isAvailable);

  const response: SuccessResponse<typeof item> = {
    message: "Item availability toggled",
    data: item,
  };

  res.status(200).json(response);
};

export const getMenuItemsByShopHandler: RequestHandler<
  {
    shopName?: string;
  },
  SuccessResponse<IMenuItem[]>
> = async (req, res) => {
  const shopId = req.user?.shopId;
  const shopName = req.params.shopName;
  const lang = req.lang;

  const menuItems = await getMenuItemsByShop({ shopId, shopName, lang });

  res.status(200).json({
    message: "MenuItems retrieved",
    data: menuItems,
  });
};
