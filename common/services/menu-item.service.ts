import { IMenuItem } from '../../models/MenuItem';
import { Shops } from '../../models/Shop';
import { Errors } from '../../errors';
import { MenuItemModel } from '../../models/MenuItem';

export const createMenuItem = async (shopId: string, menuItemData: IMenuItem) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const item = new MenuItemModel({ ...menuItemData, shopId });
  return await item.save();
};

export const getMenuItemById = async (shopId: string, itemId: string) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const menuItem = await MenuItemModel.findOne({ _id: itemId, shopId });
  if (!menuItem) throw new Errors.NotFoundError({ en: 'Menu item not found', ar: 'العنصر غير موجود' });

  return menuItem;
};

export const getItemsByShop = async (shopId: string) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  return await MenuItemModel.find({ shopId, isAvailable: true });
};

export const updateMenuItem = async (shopId: string, itemId: string, updateData: IMenuItem) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const menuItem = await MenuItemModel.findOneAndUpdate({ _id: itemId, shopId }, updateData, { new: true });
  if (!menuItem) throw new Errors.NotFoundError({ en: 'Menu item not found', ar: 'العنصر غير موجود' });

  return menuItem;
};

export const deleteMenuItem = async (shopId: string, itemId: string) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const menuItem = await MenuItemModel.findOneAndDelete({ _id: itemId, shopId });
  if (!menuItem) throw new Errors.NotFoundError({ en: 'Menu item not found', ar: 'العنصر غير موجود' });

  return { message: 'Menu item deleted successfully' };
};

export const getMenuItemsByCategory = async (shopId: string, category: string) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  return await MenuItemModel.find({ shopId, category, isAvailable: true });
};

export const toggleItemAvailability = async (shopId: string, itemId: string, isAvailable: boolean) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const menuItem = await MenuItemModel.findOneAndUpdate(
    { _id: itemId, shopId },
    { isAvailable },
    { new: true }
  );
  if (!menuItem) throw new Errors.NotFoundError({ en: 'Menu item not found', ar: 'العنصر غير موجود' });

  return menuItem;
};
