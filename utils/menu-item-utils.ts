import { IMenuItem } from "../models/MenuItem";

export const calculateFinalPrice = (
  price: number,
  discount?: number
): number => {
  if (!discount || discount <= 0 || discount > 100) return price;
  return +(price - (price * discount) / 100).toFixed(2);
};

export const buildLocalizedMenuItem = (item: IMenuItem, lang: "en" | "ar") => {
  return {
    _id: item._id,
    name: item.name[lang],
    description: item.description?.[lang],
    price: item.price,
    finalPrice: calculateFinalPrice(item.price, item.discount),
    categoryId: item.categoryId,
    isAvailable: item.isAvailable,
    imgUrl: item.imgUrl,
    options: item.options,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};
