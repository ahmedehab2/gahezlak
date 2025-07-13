import { RequestHandler } from "express";
import * as ShopService from "../services/shop.service";
import { IShop } from "../models/Shop";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { Users } from "../models/User";
import { Types } from "mongoose";
import { QRCodeOptions } from "../utils/qrCodeGenerator";
import { MenuItemModel, IMenuItem } from "../models/MenuItem";

export const createShopHandler: RequestHandler<
  {},
  SuccessResponse<IShop>,
  IShop
> = async (req, res) => {
  const shop = await ShopService.createShop(req.body, req.user?.userId!);

  await Users.updateOne(
    {
      _id: new Types.ObjectId(req.user?.userId),
    },
    {
      shopId: shop._id,
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
  IShop
> = async (req, res) => {
  const shop = await ShopService.updateShop(req.params.id, req.body);
  res.status(200).json({
    message: "Shop updated successfully",
    data: shop,
  });
};

export const deleteShopHandler: RequestHandler<
  {
    id: string;
  },
  SuccessResponse<IShop>,
  IShop
> = async (req, res) => {
  const shop = await ShopService.deleteShop(req.params.id);
  res.status(200).json({
    message: "Shop deleted successfully",
    data: shop,
  });
};

export const getAllShops: RequestHandler<
  {},
  SuccessResponse<IShop[]>,
  IShop
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
  { shopId: string },
  SuccessResponse<{ qrCodeImage: string; menuUrl: string }>,
  QRCodeOptions
> = async (req, res) => {
  const result = await ShopService.regenerateShopQRCode(req.params.shopId, req.body);
  res.status(200).json({
    message: 'QR code regenerated successfully',
    data: result
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
    message: 'Menu URL retrieved successfully',
    data: { menuUrl }
  });
};

