import { ICategory, CategoryModel } from "../models/Category";
import { MenuItemModel } from "../models/MenuItem";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import mongoose, { FilterQuery } from "mongoose";
import { calculateFinalPrice } from "../utils/menu-item-utils";
import { LangType } from "../common/types/general-types";
import { IShop, Shops } from "../models/Shop";

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

export async function deleteCategory(shopId: string, categoryId: string) {
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

  return category;
}

export async function getCategoriesByShop({
  shopId,
  shopName,
  lang,
}: {
  shopId?: string;
  shopName?: string;
  lang: LangType;
}) {
  let query: FilterQuery<ICategory> = {};

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

  const categories = await CategoryModel.find(query, {
    shopId: 0, // exclude shopId from the response
  }).lean();

  return categories;
}

// export async function getItemsInCategory(
//   shopId: string,
//   categoryId: string,
//   lang: "en" | "ar"
// ) {
//   const items = await MenuItemModel.find({
//     shopId,
//     category: categoryId,
//     isAvailable: true,
//   });

//   return items.map((item) => ({
//     _id: item._id,
//     name: typeof item.name === "object" ? item.name[lang] : item.name,
//     description:
//       typeof item.description === "object"
//         ? item.description[lang]
//         : item.description,
//     price: item.price,
//     discount: item.discount,
//     finalPrice: calculateFinalPrice(item.price, item.discount),
//     isAvailable: item.isAvailable,
//     categoryId: item.categoryId,
//     createdAt: item.createdAt,
//     updatedAt: item.updatedAt,
//   }));
// }

export async function getCategoryById(shopId: string, categoryId: string) {
  const category = await CategoryModel.findOne(
    {
      _id: new mongoose.Types.ObjectId(categoryId),
      shopId: new mongoose.Types.ObjectId(shopId),
    },
    {
      shopId: 0,
    }
  ).lean();

  if (!category) {
    throw new Errors.NotFoundError(errMsg.CATEGORY_NOT_FOUND);
  }

  return category;
}
