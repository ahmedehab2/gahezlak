import { IMenuItem } from "../models/MenuItem";

export const calculateFinalPrice = (
  price: number,
  discount?: number
): number => {
  if (!discount || discount <= 0 || discount > 100) return price;
  return +(price - (price * discount) / 100).toFixed(2);
};

