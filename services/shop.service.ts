import { IShop, Shops } from "../models/Shop";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import mongoose from "mongoose";
import { generateAndUploadMenuQRCode, QRCodeOptions } from "../utils/qrCodeGenerator";
import { Users } from "../models/User";
import { Roles } from "../models/Role";

async function createShop(
  shopData: Pick<
    IShop,
    "name" | "type" | "address" | "phoneNumber" | "email" | "qrCodeUrl" | "logoUrl"
  >,
  currentUserId: string
) {
  const shop = await Shops.create({
    ...shopData,
    ownerId: new mongoose.Types.ObjectId(currentUserId),
  });

  return shop.toObject();
}

async function getUserShop(userId: string) {
  const shop = await Shops.findOne({
    $or: [
      { ownerId: userId },
      {
        members: {
          $elemMatch: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
      },
    ],
  });
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }
  return shop;
}

async function getShopByName(shopName: string) {
  const shop = await Shops.findOne({ name: shopName });
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }
  return shop;
}

async function updateShop(shopId: string, shopData: Partial<IShop>) {
  const shop = await Shops.findByIdAndUpdate(shopId, shopData, { new: true });
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }
  return shop;
}

async function deleteShop(shopId: string) {
  const shop = await Shops.findByIdAndDelete(shopId);
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }
  return shop;
}

async function getAllShops() {
  const shops = await Shops.find({});
  return shops;
}

/**
 * Regenerate QR code for shop
 */
async function regenerateShopQRCode(
  shopId: string,
  options: QRCodeOptions = {}
): Promise<{ qrCodeUrl: string; menuUrl: string }> {
  const shop = await Shops.findById(shopId);
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }

  const qrCodeResult = await generateAndUploadMenuQRCode(shop.name, undefined, options);

  // Update shop with new QR code URL
  shop.qrCodeUrl = qrCodeResult.qrCodeUrl;
  await shop.save();

  return qrCodeResult;
}

async function addMemberToShop(shopId: string, userId: string, roleId: string) {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  // Prevent adding owner as a member
  if (shop.ownerId.toString() === userId) {
    throw new Errors.BadRequestError(errMsg.CANNOT_UPDATE_OWNER_ROLE);
  }

  // Check if user exists
  const user = await Users.findById(userId);
  if (!user) throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);

  // Check if role exists
  const role = await Roles.findById(roleId);
  if (!role) throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);

  // Check if already a member
  if (shop.members.some((m) => m.userId.toString() === userId)) {
    throw new Errors.BadRequestError(errMsg.MEMBER_ALREADY_EXISTS);
  }

  shop.members.push({ userId: new mongoose.Types.ObjectId(userId), roleId: new mongoose.Types.ObjectId(roleId) });
  await shop.save();
  return shop;
}

async function removeMemberFromShop(shopId: string, userId: string) {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  // Prevent removing owner
  if (shop.ownerId.toString() === userId) {
    throw new Errors.BadRequestError(errMsg.CANNOT_REMOVE_OWNER);
  }

  const memberIndex = shop.members.findIndex((m) => m.userId.toString() === userId);
  if (memberIndex === -1) {
    throw new Errors.NotFoundError(errMsg.MEMBER_NOT_FOUND);
  }

  shop.members.splice(memberIndex, 1);
  await shop.save();
  return shop;
}

async function updateMemberRole(shopId: string, userId: string, roleId: string) {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  // Prevent updating owner role
  if (shop.ownerId.toString() === userId) {
    throw new Errors.BadRequestError(errMsg.CANNOT_UPDATE_OWNER_ROLE);
  }

  // Check if role exists
  const role = await Roles.findById(roleId);
  if (!role) throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);

  const member = shop.members.find((m) => m.userId.toString() === userId);
  if (!member) {
    throw new Errors.NotFoundError(errMsg.MEMBER_NOT_FOUND);
  }

  member.roleId = new mongoose.Types.ObjectId(roleId);
  await shop.save();
  return shop;
}

export {
  createShop,
  updateShop,
  getAllShops,
  deleteShop,
  getUserShop,
  regenerateShopQRCode,
  addMemberToShop,
  removeMemberFromShop,
  updateMemberRole,
};
