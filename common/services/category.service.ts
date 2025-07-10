import { CategoryModel, ICategory } from '../../models/Category';
import { Shops } from '../../models/Shop';
import { Errors } from '../../errors';

export const createCategory = async (shopId: string, categoryData: ICategory) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  const category = new CategoryModel({ ...categoryData, shopId });
  return await category.save();
};

export const getCategoriesByShop = async (shopId: string) => {
  const shop = await Shops.findById(shopId);
  if (!shop) throw new Errors.NotFoundError({ en: 'Shop not found', ar: 'المتجر غير موجود' });

  return await CategoryModel.find({ shopId });
};

export const updateCategory = async (shopId: string, categoryId: string, updateData: ICategory) => {
  const category = await CategoryModel.findOneAndUpdate(
    { _id: categoryId, shopId },
    updateData,
    { new: true }
  );
  if (!category) throw new Errors.NotFoundError({ en: 'Category not found', ar: 'الفئة غير موجودة' });
  return category;
};

export const deleteCategory = async (shopId: string, categoryId: string) => {
  const category = await CategoryModel.findOneAndDelete({ _id: categoryId, shopId });
  if (!category) throw new Errors.NotFoundError({ en: 'Category not found', ar: 'الفئة غير موجودة' });
  return { message: 'Category deleted successfully' };
};