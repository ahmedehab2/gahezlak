import { RequestHandler } from "express";
import * as ShopService from "../services/shop.service";
import { IShop } from "../models/Shop";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { Users } from "../models/User";
import { Types } from "mongoose";
import { generateAndUploadMenuQRCode } from "../utils/qrCodeGenerator";
import uploadToImgbb from "../utils/uploadToImgbb";
import { Role, Roles } from "../models/Role";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { cancelSubscription } from "../services/subscription.service";

export const createShopHandler: RequestHandler<
  {},
  SuccessResponse<IShop>,
  Pick<IShop, "name" | "type" | "address" | "phoneNumber" | "email">
> = async (req, res) => {
  const { name } = req.body;

  // Generate and upload QR code for the new shop
  const qrCodeResult = await generateAndUploadMenuQRCode(name);

  // Upload logo image to imgbb (if provided)
  let logoUrl: string | undefined = undefined;
  if (req.file) {
    const imgbbResponse = await uploadToImgbb(req.file);
    logoUrl = imgbbResponse?.data?.url;
  }

  // Create the shop
  const shop = await ShopService.createShop(
    {
      ...req.body,
      qrCodeUrl: qrCodeResult.qrCodeUrl,
      logoUrl,
    },
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
    shopId: string;
  },
  SuccessResponse<IShop>,
  Partial<IShop>
> = async (req, res) => {
  let updateData = { ...req.body };

  // Handle logo image upload if present
  if (req.file) {
    const imgbbResponse = await (
      await import("../utils/uploadToImgbb")
    ).default(req.file);
    const logoUrl = imgbbResponse?.data?.url;
    if (!logoUrl) {
      throw new Error("Failed to upload logo image to imgbb");
    }
    updateData.logoUrl = logoUrl;
  }

  const shop = await ShopService.updateShop(req.params.shopId, updateData);
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
  SuccessResponse<{ qrCodeUrl: string; menuUrl: string }>,
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
  {},
  SuccessResponse<{}>,
  {}
> = async (req, res) => {
  const { userId } = req.user!;

  // Cancel the subscription
  await cancelSubscription(userId);

  res.status(200).json({
    message: "Shop subscription cancelled successfully",
    data: {},
  });
};
