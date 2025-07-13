import { CategoryModel, ICategory } from '../../models/Category';
import { Shops } from '../../models/Shop';
import { Errors } from '../../errors';
import { ObjectId } from 'mongodb';
import { IMenuItem, MenuItemModel } from '../../models/MenuItem';
import {  buildLocalizedMenuItem } from '../../utils/menu-item-utils';
import { LangType } from '../types/general-types';

export const createCategory = async (shopId: string, categoryData: ICategory) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const { menuItems, ...safeData } = categoryData; // Prevent menuItems injection
  const category = new CategoryModel({ ...safeData, shopId });
  return await category.save();
};

export const getCategoriesWithItemsByShop = async (shopId: string, lang: LangType) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });
  const categories = await CategoryModel.find({ shopId }).populate({ path: 'menuItems' });

  return categories.map((cat) => {
    const localizedItems = cat.menuItems?.map((item: any) => buildLocalizedMenuItem(item, lang)) || [];
    return {
      _id: cat._id,
      shopId: cat.shopId,
      name: cat.name,
      description: cat.description,
      menuItems: localizedItems,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt
    };
  });
};  

export const updateCategory = async (shopId: string, categoryId: string, updateData: ICategory) => {
  const { menuItems, ...safeUpdate } = updateData; // Prevent menuItems overwrite
  const category = await CategoryModel.findOneAndUpdate(
    { _id: categoryId, shopId },
    safeUpdate,
    { new: true }
  );
  if (!category) throw new Errors.NotFoundError({ en: 'Category not found', ar: 'الفئة غير موجودة' });
  return category;
};

export const updateItemInCategory = async (shopId: string, categoryId: string, itemId: string, updateData: IMenuItem) => {
  const category = await CategoryModel.findOne({ _id: categoryId, shopId });
  if (!category) throw new Errors.NotFoundError({ en: 'Category not found', ar: 'الفئة غير موجودة' });

  const item = category.menuItems?.find(id => id.toString() === itemId);
  if (!item) throw new Errors.NotFoundError({ en: 'Item not found in category', ar: 'العنصر غير موجود في الفئة' });

  const updatedItem = await MenuItemModel.findByIdAndUpdate(itemId, updateData, { new: true });
  if (!updatedItem) throw new Errors.NotFoundError({ en: 'Menu item not found', ar: 'العنصر غير موجود' });

  return updatedItem;
};

export const getItemsInCategory = async (shopId: string, categoryId: string, lang: LangType) => {
  const category = await CategoryModel.findOne({ _id: categoryId, shopId });
  if (!category) {
    throw new Errors.NotFoundError({ en: 'Category not found', ar: 'الفئة غير موجودة' });
  }

  const items = await MenuItemModel.find({
    categoryId,
    shopId,
    isAvailable: true
  }).populate({
    path: 'categoryId',
    select: 'name'
  });

  if (!items.length) {
    throw new Errors.NotFoundError({ en: 'No items found in this category', ar: 'لا توجد عناصر في هذه الفئة' });
  }

  return items.map((item) => buildLocalizedMenuItem(item, lang));
};

export const getCategoryById = async (shopId: string, categoryId: string) => {
  const category = await CategoryModel.findOne({ _id: categoryId, shopId });
  if (!category) throw new Errors.NotFoundError({ en: 'Category not found', ar: 'الفئة غير موجودة' });
  return category;
};

export const deleteCategoryAndItems = async (shopId: string, categoryId: string) => {
  const category = await CategoryModel.findOne({ _id: categoryId, shopId });
  if (!category)
    throw new Errors.NotFoundError({ en: 'Category not found', ar: 'الفئة غير موجودة' });

  await MenuItemModel.deleteMany({ _id: { $in: category.menuItems } });
  await CategoryModel.findByIdAndDelete(categoryId);

  return { message: 'Category and its items deleted successfully' };
};
