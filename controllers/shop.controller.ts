import { RequestHandler } from "express";
import * as ShopService from "../services/shop.service";
import { IShop } from "../models/Shop";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { Users } from "../models/User";
import { Types } from "mongoose";
import { generateMenuQRCode, QRCodeOptions } from "../utils/qrCodeGenerator";
import { MenuItemModel, IMenuItem } from "../models/MenuItem";
import { Role, Roles } from "../models/Role";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";

export const createShopHandler: RequestHandler<
  {},
  SuccessResponse<IShop>,
  Pick<IShop, "name" | "type" | "address" | "phoneNumber" | "email">
> = async (req, res) => {
  const { name } = req.body;

  // Generate QR code for the new shop
  const qrCodeResult = await generateMenuQRCode(name);

  // Create the shop
  const shop = await ShopService.createShop(
    { ...req.body, qrCodeImage: qrCodeResult.qrCodeImage },
    req.user?.userId!
  );

  // Get the shop owner role
  const shopOwnerRole = await Roles.findOne({ name: Role.SHOP_OWNER });
  if (!shopOwnerRole) {
    throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);
  }

  // Update the user's shopId
  await Users.updateOne(
    {
      _id: new Types.ObjectId(req.user?.userId),
    },
    {
      shop: shop._id,
      role: shopOwnerRole._id,
    }
  );
  res.status(201).json({
    message: "Shop created successfully",
    data: shop,
  });
};

export const updateShopHandler: RequestHandler<
  {
    id: string;
  },
  SuccessResponse<IShop>,
  Pick<IShop, "name" | "type" | "address" | "phoneNumber" | "email">
> = async (req, res) => {
  const shop = await ShopService.updateShop(req.params.id, req.body);
  res.status(200).json({
    message: "Shop updated successfully",
    data: shop,
  });
};

// export const deleteShopHandler: RequestHandler<
//   {
//     id: string;
//   },
//   SuccessResponse<IShop>,
//   unknown
// > = async (req, res) => {
//   const shop = await ShopService.deleteShop(req.params.id);

// };

export const getAllShops: RequestHandler<
  {},
  SuccessResponse<IShop[]>,
  unknown
> = async (req, res) => {
  const shops = await ShopService.getAllShops();
  res.status(200).json({
    message: "Shops fetched successfully",
    data: shops,
  });
};

/**
 * Regenerate QR code for shop
 */
export const regenerateQRCodeHandler: RequestHandler<
  { id: string },
  SuccessResponse<{ qrCodeImage: string; menuUrl: string }>,
  QRCodeOptions
> = async (req, res) => {
  const result = await ShopService.regenerateShopQRCode(
    req.params.id,
    req.body
  );
  res.status(200).json({
    message: "QR code regenerated successfully",
    data: result,
  });
};

/**
 * Get shop menu URL
 */
export const getMenuUrlHandler: RequestHandler<
  { shopName: string },
  SuccessResponse<{ menuUrl: string }>,
  any
> = async (req, res) => {
  const menuUrl = await ShopService.getShopMenuUrl(req.params.shopName);
  res.status(200).json({
    message: "Menu URL retrieved successfully",
    data: { menuUrl },
  });
};
