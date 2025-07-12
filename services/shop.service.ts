import { IShop, Shops } from "../models/Shop";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import mongoose from "mongoose";
// import { createSubscription } from "./subscription.service";

async function createShop(shopData: Partial<IShop>, currentUserId: string) {
  // Create a new shop
  const shop = await Shops.create({
    ...shopData,
    ownerId: new mongoose.Types.ObjectId(currentUserId),
  });

  return shop.toObject();
}

async function getShop(shopId: string, userId: string) {
  const shop = await Shops.findOne({ _id: shopId, ownerId: userId });
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

export { createShop, updateShop, getAllShops, deleteShop, getShop };
