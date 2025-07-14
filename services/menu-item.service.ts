import { Shops } from '../models/Shop';
import { CategoryModel } from '../models/Category';
import { MenuItemModel, IMenuItem } from '../models/MenuItem';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';
import { buildLocalizedMenuItem } from '../utils/menu-item-utils';

export const createMenuItemAndAddToCategory = async (
  shopId: string,
  menuItemData: IMenuItem,
  categoryId: string
) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  const category = await CategoryModel.findOne({ _id: categoryId, shopId });
  if (!category) throw new Errors.NotFoundError(errMsg.CATEGORY_NOT_FOUND);

  const item = new MenuItemModel({
    ...menuItemData,
    shopId,
    category: category._id
  });

  const savedItem = await item.save();

  const alreadyExists = category.menuItems?.some(id => id.toString() === savedItem._id.toString());
  if (!alreadyExists) {
    category.menuItems?.push(savedItem._id);
    await category.save();
  }

  return savedItem.toObject();
};

export const getMenuItemById = async (shopId: string, itemId: string, lang: 'en' | 'ar') => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  const menuItem = await MenuItemModel.findOne({ _id: itemId, shopId });
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  return buildLocalizedMenuItem(menuItem, lang);
};

export const deleteMenuItem = async (shopId: string, itemId: string) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);

  const menuItem = await MenuItemModel.findOneAndDelete({ _id: itemId, shopId });
  if (!menuItem) throw new Errors.NotFoundError(errMsg.MENU_ITEM_NOT_FOUND);

  await CategoryModel.updateMany(
    { shopId, menuItems: itemId },
    { $pull: { menuItems: itemId } }
  );

  return { message: 'Menu item deleted and removed from categories successfully' };
};

export const toggleItemAvailability = async (shopId: string, itemId: string, isAvailable: boolean) => {
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
