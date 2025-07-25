import { IShop, Shops } from "../models/Shop";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import mongoose, { FilterQuery, ProjectionFields } from "mongoose";
import {
  generateAndUploadMenuQRCode,
  QRCodeOptions,
} from "../utils/qrCodeGenerator";
import { Users } from "../models/User";
import { Roles } from "../models/Role";
import { hash } from "bcryptjs";
import { collectionsName } from "../common/collections-name";

async function createShop(
  shopData: Pick<
    IShop,
    | "name"
    | "type"
    | "address"
    | "phoneNumber"
    | "email"
    | "qrCodeUrl"
    | "logoUrl"
  >,
  currentUserId: string
) {
  const existingShop = await Shops.findOne({
    ownerId: new mongoose.Types.ObjectId(currentUserId),
  });

  if (existingShop) {
    throw new Errors.BadRequestError(errMsg.USER_ALREADY_HAS_SHOP);
  }

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

async function getShop({
  shopName,
  shopId,
}: {
  shopName?: string;
  shopId?: string;
}) {
  const query: FilterQuery<IShop> = {};
  let select: ProjectionFields<IShop> = {};
  if (shopName) {
    query.name = shopName;
    select = {
      name: 1,
      logoUrl: 1,
      qrCodeUrl: 1,
      type: 1,
      address: 1,
    };
  }
  if (shopId) {
    query._id = shopId;
  }

  const shop = await Shops.findOne(query).select(select);
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

  const qrCodeResult = await generateAndUploadMenuQRCode(
    shop.name,
    undefined,
    options
  );

  // Update shop with new QR code URL
  shop.qrCodeUrl = qrCodeResult.qrCodeUrl;
  await shop.save();

  return qrCodeResult;
}

async function getShopMembers(shopId: string) {
  const shop = await Shops.findById(shopId)
    .populate({
      path: "members.userId",
      model: collectionsName.USERS,
      select: "firstName lastName email phoneNumber",
    })
    .populate({
      path: "members.roleId",
      model: collectionsName.ROLES,
      select: "name",
    })
    .lean();

  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }

  return shop.members;
}

async function removeMemberFromShop(shopId: string, userId: string) {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  // Prevent removing owner
  if (shop.ownerId.toString() === userId) {
    throw new Errors.BadRequestError(errMsg.CANNOT_REMOVE_OWNER);
  }

  const memberIndex = shop.members.findIndex(
    (m) => m.userId.toString() === userId
  );
  if (memberIndex === -1) {
    throw new Errors.NotFoundError(errMsg.MEMBER_NOT_FOUND);
  }

  await Users.findByIdAndDelete(userId);

  shop.members.splice(memberIndex, 1);
  await shop.save();
  return shop;
}

async function updateMemberRole(
  shopId: string,
  userId: string,
  roleId: string
) {
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

async function getShopById(shopId: string) {
  const shop = await Shops.findById(shopId);
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }
  return shop;
}

async function registerShopMember(
  shopId: string,
  memberData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    roleId: string;
  }
) {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  // Check if role exists
  const role = await Roles.findById(memberData.roleId);
  if (!role) throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);

  // Hash password
  const hashedPassword = await hash(
    memberData.password,
    parseInt(process.env.saltRounds || "7")
  );

  // Create the new user
  const newUser = await Users.create({
    firstName: memberData.firstName,
    lastName: memberData.lastName,
    email: memberData.email.toLowerCase(),
    password: hashedPassword,
    phoneNumber: memberData.phoneNumber,
    role: new mongoose.Types.ObjectId(memberData.roleId),
    shop: new mongoose.Types.ObjectId(shopId),
    isVerified: true, // Shop members are automatically verified
  });

  // Add member to shop
  shop.members.push({
    userId: newUser._id as any,
    roleId: new mongoose.Types.ObjectId(memberData.roleId),
  });
  await shop.save();

  // Return user data without password
  const { _id, firstName, lastName, email, phoneNumber } = newUser.toObject();
  return {
    _id,
    firstName,
    lastName,
    email,
    phoneNumber,
  };
}

export {
  createShop,
  updateShop,
  getAllShops,
  deleteShop,
  getUserShop,
  regenerateShopQRCode,
  removeMemberFromShop,
  updateMemberRole,
  getShopById,
  registerShopMember,
  getShop,
  getShopMembers,
};
