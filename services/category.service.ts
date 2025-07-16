import { ICategory, CategoryModel } from "../models/Category";
import { MenuItemModel } from "../models/MenuItem";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import mongoose from "mongoose";
import { Shops } from "../models/Shop";

export async function createCategory(
  shopId: string,
  categoryData: Partial<ICategory>
) {
  const category = await CategoryModel.create({
    ...categoryData,
    shopId,
  });
  return category.toObject();
}

export async function updateCategory(
  shopId: string,
  categoryId: string,
  updateData: Partial<ICategory>
) {
  const category = await CategoryModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(categoryId),
      shopId,
    },
    updateData,
    { new: true }
  ).lean();

  if (!category) {
    throw new Errors.NotFoundError(errMsg.CATEGORY_NOT_FOUND);
  }

  return category;
}

export async function deleteCategoryAndItems(
  shopId: string,
  categoryId: string
) {
  const category = await CategoryModel.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(categoryId),
    shopId,
  });

  if (!category) {
    throw new Errors.NotFoundError(errMsg.CATEGORY_NOT_FOUND);
  }

  await MenuItemModel.updateMany(
    { category: categoryId },
    { category: null, isAvailable: false }
  );

  return { deletedCategoryId: categoryId };
}

export async function getCategoriesByShop(query: string, lang: "en" | "ar") {
  let categories;

  if (mongoose.Types.ObjectId.isValid(query)) {
    categories = await CategoryModel.find({ shopId: query }).lean();
  } else {
    const shop = await Shops.findOne({ name: query });
    if (!shop) throw new Error("Shop not found");
    categories = await CategoryModel.find({ shopId: shop._id }).lean();
  }

  return categories.map((cat) => ({
    ...cat,
    name: typeof cat.name === "object" ? cat.name[lang] : cat.name,
    description:
      typeof cat.description === "object"
        ? cat.description[lang]
        : cat.description,
  }));
}

export async function getCategoryById(shopId: string, categoryId: string) {
  const category = await CategoryModel.findOne({
    _id: new mongoose.Types.ObjectId(categoryId),
    shopId,
  }).lean();

  if (!category) {
    throw new Errors.NotFoundError(errMsg.CATEGORY_NOT_FOUND);
  }

  return category;
}
