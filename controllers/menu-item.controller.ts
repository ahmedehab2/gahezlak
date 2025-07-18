import { RequestHandler } from "express";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItemsByShop,
  toggleItemAvailability,
  updateMenuItem,
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
    const uploadResult = await uploadToImgbb(req.file);
    imageUrl = uploadResult?.data?.url; // Only use the direct image URL
  }

  // Parse options if sent as a string (from multipart/form-data)
  let options = req.body.options;
  if (typeof options === "string") {
    try {
      options = JSON.parse(options);
    } catch (e) {
      const errorResponse: SuccessResponse<null> = {
        message: "Invalid JSON for options",
        data: null,
      };
      res.status(400).json(errorResponse as any);
      return;
    }
  }

  if (!req.body.categoryId) {
    const errorResponse: SuccessResponse<null> = {
      message: "categoryId is required",
      data: null,
    };
    res.status(400).json(errorResponse as any);
    return;
  }

  const menuItemPayload: any = {
    ...req.body,
    imgUrl: imageUrl,
  };
  if (options !== undefined) {
    menuItemPayload.options = options;
  }

  const item = await createMenuItem(shopId, menuItemPayload);

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










export const updateMenuItemHandler: RequestHandler<
  { shopId: string; itemId: string },
  SuccessResponse<IMenuItem>,
  Partial<IMenuItem>
> = async (req, res, next) => {
  const { shopId, itemId } = req.params;
  let updateData = { ...req.body };

  // Handle image upload if present
  if (req.file) {
    const uploadResult = await uploadToImgbb(req.file);
    updateData.imgUrl = uploadResult?.data?.url; // Only use the direct image URL
  }

  // Parse options if sent as a string (from multipart/form-data)
  if (typeof updateData.options === "string") {
    try {
      updateData.options = JSON.parse(updateData.options);
    } catch (e) {
      const errorResponse: SuccessResponse<null> = {
        message: "Invalid JSON for options",
        data: null,
      };
      res.status(400).json(errorResponse as any);
      return;
    }
  }
  // Parse name if sent as a string
  if (typeof updateData.name === "string") {
    try {
      updateData.name = JSON.parse(updateData.name);
    } catch (e) {}
  }
  // Parse description if sent as a string
  if (typeof updateData.description === "string") {
    try {
      updateData.description = JSON.parse(updateData.description);
    } catch (e) {}
  }
  // Convert price and discount to numbers if sent as strings
  if (typeof updateData.price === "string") {
    updateData.price = Number(updateData.price);
  }
  if (typeof updateData.discount === "string") {
    updateData.discount = Number(updateData.discount);
  }
  // Convert isAvailable to boolean if sent as a string
  if (typeof updateData.isAvailable === "string") {
    updateData.isAvailable = updateData.isAvailable === "true";
  }

  const updatedItem = await updateMenuItem(shopId, itemId, updateData);

  res.status(200).json({
    message: "Menu item updated successfully",
    data: updatedItem,
  });
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
