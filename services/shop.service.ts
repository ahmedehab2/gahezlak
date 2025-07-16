import { IShop, Shops } from "../models/Shop";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import mongoose from "mongoose";
import { generateMenuQRCode, QRCodeOptions } from "../utils/qrCodeGenerator";

async function createShop(
  shopData: Pick<
    IShop,
    "name" | "type" | "address" | "phoneNumber" | "email" | "qrCodeImage"
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
): Promise<{ qrCodeImage: string; menuUrl: string }> {
  const shop = await Shops.findById(shopId);
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }

  const qrCodeResult = await generateMenuQRCode(shop.name, undefined, options);

  // Update shop with new QR code base64 data
  shop.qrCodeImage = qrCodeResult.qrCodeImage;
  await shop.save();

  return qrCodeResult;
}

export {
  createShop,
  updateShop,
  getAllShops,
  deleteShop,
  getUserShop,
  regenerateShopQRCode,
};
