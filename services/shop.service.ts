import { IShop, Shops } from "../models/Shop";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import mongoose from "mongoose";
import { generateMenuQRCode, QRCodeOptions } from "../utils/qrCodeGenerator";

async function createShop(shopData: Partial<IShop>, currentUserId: string) {
  const shop = await Shops.create({
    ...shopData,
    ownerId: new mongoose.Types.ObjectId(currentUserId),
  });

  // Generate QR code for the new shop
  try {
    const qrCodeResult = await generateMenuQRCode(shop.name);
    shop.qrCodeImage = qrCodeResult.qrCodeImage;
    await shop.save();
  } catch (error) {
    console.error('Failed to generate QR code for new shop:', error);
    // Don't fail shop creation if QR code generation fails
  }

  return shop.toObject();
}

async function getShop(shopId: string, userId: string) {
  const shop = await Shops.findOne({ _id: shopId, ownerId: userId });
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
export async function regenerateShopQRCode(
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

/**
 * Get shop menu URL
 */
export async function getShopMenuUrl(shopName: string): Promise<string> {
  const shop = await Shops.findOne({ name: shopName });
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/menu/${shopName}`;
}

export { createShop, updateShop, getAllShops, deleteShop, getShop, getShopByName };
