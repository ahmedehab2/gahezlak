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
import { getUserShop } from "../services/shop.service";
import { uploadImageToImgBB } from "../utils/imgbb";
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
    await getUserShop(req.user?.userId!);

    let imageUrl: string | undefined;
    
    if (req.file) {
      imageUrl = await uploadImageToImgBB(req.file.buffer);
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
  { shopId: string; itemId: string },
  SuccessResponse<IMenuItem>,
  unknown,
  { lang: "en" | "ar" }
> = async (req, res) => {
  const { shopId, itemId } = req.params;
  const lang = req.lang;
  const item = await getMenuItemById(shopId, itemId, lang);

  res.status(200).json({
    message: "Menu item retrieved",
    data: item as unknown as IMenuItem, // TODO: fix this
  });
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
