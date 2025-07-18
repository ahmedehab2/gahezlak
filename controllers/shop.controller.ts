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
import {
  cancelSubscription
} from "../services/subscription.service";
import {
  addMemberToShop,
  removeMemberFromShop,
  updateMemberRole,
} from "../services/shop.service";


export const createShopHandler: RequestHandler<
  {},
  SuccessResponse<IShop>,
  Pick<IShop, "name" | "type" | "address" | "phoneNumber" | "email">
> = async (req, res) => {
  const { name } = req.body;

  // Generate and upload QR code for the new shop
  const qrCodeResult = await generateAndUploadMenuQRCode(name);

  // Upload logo image to imgbb (if provided)
let logoUrl;
let logoDeleteUrl;
if (req.file) {
  const imgbbResponse = await uploadToImgbb(req.file);
  logoUrl = imgbbResponse?.data?.url;
  logoDeleteUrl = imgbbResponse?.data?.delete_url;
  console.log('Extracted logoUrl:', logoUrl);
  console.log('Extracted logoDeleteUrl:', logoDeleteUrl);
}

  // Create the shop
  const payload: any = {
    ...req.body,
    qrCodeUrl: qrCodeResult.qrCodeUrl,
    logoUrl,
  };
  if (logoDeleteUrl) {
    payload.logoDeleteUrl = logoDeleteUrl;
  }
  const shop = await ShopService.createShop(
    payload,
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
    // If there is an old logo, delete it from imgbb
    const oldShop = await ShopService.getShopById(req.params.shopId);
    console.log('Old shop logoDeleteUrl:', oldShop?.logoDeleteUrl);
    if (oldShop?.logoDeleteUrl) {
      console.log('Attempting to delete old logo from imgbb...');
      try {
        await fetch(oldShop.logoDeleteUrl);
        console.log('Old logo deleted successfully from imgbb');
      } catch (error) {
        console.log('Failed to delete old logo:', error);
      }
      console.log('Delete request sent to imgbb');
    }
    const imgbbResponse = await uploadToImgbb(req.file);
    const logoUrl = imgbbResponse?.data?.url;
    const logoDeleteUrl = imgbbResponse?.data?.delete_url;
    console.log('New logoUrl:', logoUrl);
    console.log('New logoDeleteUrl:', logoDeleteUrl);
    if (!logoUrl) {
      throw new Error("Failed to upload logo image to imgbb");
    }
    updateData.logoUrl = logoUrl;
    updateData.logoDeleteUrl = logoDeleteUrl;
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

export const addMemberHandler: RequestHandler = async (req, res) => {
  const { shopId } = req.params;
  const { userId, roleId } = req.body;
  const shop = await addMemberToShop(shopId, userId, roleId);
  res.status(200).json({
    message: "Member added successfully",
    data: shop,
  });
};

export const removeMemberHandler: RequestHandler = async (req, res) => {
  const { shopId, userId } = req.params;
  const shop = await removeMemberFromShop(shopId, userId);
  res.status(200).json({
    message: "Member removed successfully",
    data: shop,
  });
};

export const updateMemberRoleHandler: RequestHandler = async (req, res) => {
  const { shopId, userId } = req.params;
  const { roleId } = req.body;
  const shop = await updateMemberRole(shopId, userId, roleId);
  res.status(200).json({
    message: "Member role updated successfully",
    data: shop,
  });
};
