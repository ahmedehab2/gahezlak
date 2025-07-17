import { Shops } from "../models/Shop";
import { CategoryModel } from "../models/Category";
import { MenuItemModel, IMenuItem } from "../models/MenuItem";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { getCategoryById } from "./category.service";
import { LangType } from "../common/types/general-types";
import mongoose, { FilterQuery } from "mongoose";

export const createMenuItem = async (
  shopId: string,
  menuItemData: Pick<
    IMenuItem,
    "name" | "description" | "price" | "categoryId" | "imgUrl" | "discount"
  >
) => {
  await getCategoryById(shopId, menuItemData.categoryId.toString()); // make sure the category exists

  const menuItem = await MenuItemModel.create({
    ...menuItemData,
    shopId,
  });

  return menuItem.toObject();
};

export const getMenuItemById = async (
  shopId: string,
  itemId: string,
  lang: "en" | "ar"
) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  const menuItem = await MenuItemModel.findOne({ _id: itemId, shopId });
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  return menuItem.toObject();
};

export const deleteMenuItem = async (shopId: string, itemId: string) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  const menuItem = await MenuItemModel.findOneAndDelete({
    _id: itemId,
    shopId,
  });
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  await CategoryModel.updateMany(
    { shopId, menuItems: itemId },
    { $pull: { menuItems: itemId } }
  );

  return {
    message: "Menu item deleted and removed from categories successfully",
  };
};

export const toggleItemAvailability = async (
  shopId: string,
  itemId: string,
  isAvailable: boolean
) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  const menuItem = await MenuItemModel.findOneAndUpdate(
    { _id: itemId, shopId },
    { isAvailable },
    { new: true }
  );
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  return menuItem.toObject();
};


export async function getMenuItemsByShop({
  shopId,
  shopName,
  lang,
}: {
  shopId?: string;
  shopName?: string;
  lang: LangType;
}) {
  let query: FilterQuery<IMenuItem> = {};

  if (shopId) {
    query.shopId = new mongoose.Types.ObjectId(shopId);
  }

  if (shopName) {
    const shop = await Shops.findOne({ name: shopName }).lean();
    if (!shop) {
      throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
    }
    query.shopId = shop._id;
  }

  const menuItems = await MenuItemModel.find(query, {
    shopId: 0, // exclude shopId from the response
  }).lean();
  return menuItems;

}