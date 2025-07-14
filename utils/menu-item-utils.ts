export const calculateFinalPrice = (
  price: number,
  discount?: number
): number => {
  if (!discount || discount <= 0 || discount > 100) return price;
  return +(price - (price * discount) / 100).toFixed(2);
};

export const buildLocalizedMenuItem = (item: any, lang: "en" | "ar") => {
  const localizedItem = {
    _id: item._id,
    name: item.name,
    description: item.description,
    price: item.price,
    discount: item.discount,
    finalPrice: calculateFinalPrice(item.price, item.discount),
    category: item.category,
    isAvailable: item.isAvailable,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  return localizedItem;
};
