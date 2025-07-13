import { Shops } from '../../models/Shop';
import { Errors } from '../../errors';
import { CategoryModel } from '../../models/Category';
import { MenuItemModel, IMenuItem } from '../../models/MenuItem';
import { calculateFinalPrice, buildLocalizedMenuItem } from '../../utils/menu-item-utils';

export const createMenuItemAndAddToCategory = async (
  shopId: string,
  menuItemData: IMenuItem,
  categoryId: string
) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const category = await CategoryModel.findOne({ _id: categoryId, shopId });
  if (!category) throw new Errors.NotFoundError({ en: 'Category not found', ar: 'الفئة غير موجودة' });

  const item = new MenuItemModel({
    ...menuItemData,
    shopId,
    category: category.name,
  });

  const savedItem = await item.save();

  const alreadyExists = category.menuItems?.some(id => id.toString() === savedItem._id.toString());
  if (!alreadyExists) {
    category.menuItems?.push(savedItem._id);
    await category.save();
  }

  return savedItem;
};

export const getMenuItemById = async (shopId: string, itemId: string, lang: 'en' | 'ar') => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const menuItem = await MenuItemModel.findOne({ _id: itemId, shopId });
  if (!menuItem) throw new Errors.NotFoundError({ en: 'Menu item not found', ar: 'العنصر غير موجود' });

  return buildLocalizedMenuItem(menuItem, lang);
};

export const deleteMenuItem = async (shopId: string, itemId: string) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const menuItem = await MenuItemModel.findOneAndDelete({ _id: itemId, shopId });
  if (!menuItem) throw new Errors.NotFoundError({ en: 'Menu item not found', ar: 'العنصر غير موجود' });

  await CategoryModel.updateMany(
    { shopId, menuItems: itemId },
    { $pull: { menuItems: itemId } }
  );

  return { message: 'Menu item deleted and removed from categories successfully' };
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
