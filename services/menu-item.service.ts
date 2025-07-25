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
  const menuItem = await MenuItemModel.findOne({ _id: itemId, shopId }).lean();
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  return menuItem;
};

export const deleteMenuItem = async (shopId: string, itemId: string) => {
  const menuItem = await MenuItemModel.findOneAndDelete({
    _id: itemId,
    shopId,
  }).lean();
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  await CategoryModel.updateMany(
    { shopId, menuItems: itemId },
    { $pull: { menuItems: itemId } }
  );

  return menuItem;
};

export const toggleItemAvailability = async (
  shopId: string,
  itemId: string,
  isAvailable: boolean
) => {
  const menuItem = await MenuItemModel.findOneAndUpdate(
    { _id: itemId, shopId },
    { isAvailable },
    { new: true }
  );
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  return menuItem.toObject();
};

export const updateMenuItem = async (
  shopId: string,
  itemId: string,
  updateData: Partial<IMenuItem>
) => {
  const menuItem = await MenuItemModel.findOneAndUpdate(
    { _id: itemId, shopId },
    updateData,
    { new: true }
  );
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  return menuItem.toObject();
};

export async function getMenuItemsByShop({
  shopId,
  shopName,
  lang,
  // skip,
  // limit,
  //search,
}: {
  shopId?: string;
  shopName?: string;
  lang: LangType;
  // skip: number;
  // limit: number;
  //search?: string;
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

  // use $or to search in both english and arabic search 
  // if (search) {
  //   query.$or = [
  //     { "translations.name.en": { $regex: search, $options: "i" } },
  //     { "translations.name.ar": { $regex: search, $options: "i" } },
  //   ];
  // }

  const items = await MenuItemModel.find(query, {
    shopId: 0,
  })
    // .skip(skip)
    // .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const totalCount = await MenuItemModel.countDocuments(query);

  return { items, totalCount };
}
