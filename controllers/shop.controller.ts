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
import { Shops } from "../models/Shop";
import { Subscriptions } from "../models/Subscription";

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
  {},
  SuccessResponse<{ qrCodeImage: string; menuUrl: string }>,
  { options?: any }
> = async (req, res) => {
  const userId = req.user?.userId;
  const user = await Users.findById(userId);
  if (!user || !user.shop) {
    throw new Errors.NotFoundError(errMsg.USER_HAS_NO_SHOP);
  }

  const result = await ShopService.regenerateShopQRCode(
    user.shop.toString(),
    req.body.options
  );

  res.status(200).json({
    message: "QR code regenerated successfully",
    data: result,
  });
};

// Cancel shop subscription
export const cancelShopSubscriptionHandler: RequestHandler<
  { shopId: string },
  SuccessResponse<{}>,
  {}
> = async (req, res) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new Errors.UnauthorizedError(errMsg.USER_NOT_AUTHENTICATED);
  }

  // Verify shop ownership
  const shop = await Shops.findById(shopId);
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }

  if (shop.ownerId.toString() !== userId) {
    throw new Errors.UnauthorizedError(errMsg.UNAUTHORIZED_SHOP_SUBSCRIPTION_CANCEL);
  }

  // Get shop's subscription
  const subscription = await (await import("../services/subscription.service")).getUserActiveSubscription(userId);
  if (!subscription) {
    throw new Errors.NotFoundError(errMsg.NO_SUBSCRIPTION_FOUND);
  }

  // Cancel the subscription
  await (await import("../services/subscription.service")).cancelSubscription((subscription as any)._id.toString());

  res.status(200).json({
    message: "Shop subscription cancelled successfully",
    data: {},
  });
};

// Get shop subscription
// export const getShopSubscriptionHandler: RequestHandler<
//   { shopId: string },
//   SuccessResponse<any>,
//   {}
// > = async (req, res) => {
//   const { shopId } = req.params;
//   const userId = req.user?.userId;

//   if (!userId) {
//     throw new Errors.UnauthorizedError(errMsg.USER_NOT_AUTHENTICATED);
//   }

//   // Verify shop ownership
//   const shop = await Shops.findById(shopId);
//   if (!shop) {
//     throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
//   }

//   if (shop.ownerId.toString() !== userId) {
//     throw new Errors.UnauthorizedError(errMsg.UNAUTHORIZED_SHOP_SUBSCRIPTION_VIEW);
//   }

//   // Get shop's subscription by subscriptionId
//   if (!shop.subscriptionId) {
//     throw new Errors.NotFoundError(errMsg.NO_SUBSCRIPTION_FOUND);
//   }

//   const subscription = await Subscriptions.findById(shop.subscriptionId);
//   if (!subscription) {
//     throw new Errors.NotFoundError(errMsg.NO_SUBSCRIPTION_FOUND);
//   }

//   res.status(200).json({
//     message: "Shop subscription retrieved successfully",
//     data: subscription,
//   });
// };
