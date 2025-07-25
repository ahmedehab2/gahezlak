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
import {
  removeMemberFromShop,
  updateMemberRole,
  registerShopMember,
  getShopMembers,
} from "../services/shop.service";
import { PaginatedRespone } from "../common/types/contoller-response.types";

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
  if (req.file) {
    const imgbbResponse = await uploadToImgbb(req.file);
    logoUrl = imgbbResponse?.data?.url;
  }

  // Create the shop
  const payload: any = {
    ...req.body,
    qrCodeUrl: qrCodeResult.qrCodeUrl,
    logoUrl,
  };

  const shop = await ShopService.createShop(payload, req.user?.userId!);

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
  // Handle logo image upload if present

  let logoUrl;
  if (req.file) {
    const imgbbResponse = await uploadToImgbb(req.file);
    logoUrl = imgbbResponse?.data?.url;
  }

  const shop = await ShopService.updateShop(req.params.shopId, {
    ...req.body,
    logoUrl,
  });
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

// return shop details for logged in user or public
export const getShopHandler: RequestHandler<
  { shopName?: string; shopId?: string },
  SuccessResponse<IShop>,
  unknown
> = async (req, res) => {
  const shop = await ShopService.getShop({
    shopId: req.params.shopId,
    shopName: req.params.shopName,
  });
  res.status(200).json({
    message: "Shop fetched successfully",
    data: shop,
  });
};

export const getAllShops: RequestHandler<
  {},
  PaginatedRespone<IShop>,
  unknown,
  { page?: string; limit?: string; search?: string; order?: "asc" | "desc" }
> = async (req, res) => {
  const { page = "1", limit = "10", search = "", order = "desc" } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { shops, total } = await ShopService.getAllShops({
    page: pageNum,
    limit: limitNum,
    search,
    order,
  });
  res.status(200).json({
    message: "Data retreived.",
    data: shops,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
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
  const { firstName, lastName, email, password, phoneNumber, roleId } =
    req.body;

  const newMember = await registerShopMember(shopId, {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    roleId,
  });

  res.status(201).json({
    message: "Member added successfully",
    data: newMember,
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

export const getShopMembersHandler: RequestHandler = async (req, res) => {
  const { shopId } = req.params;
  const members = await ShopService.getShopMembers(shopId);
  res.status(200).json({
    message: "Shop members fetched successfully",
    data: members,
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
