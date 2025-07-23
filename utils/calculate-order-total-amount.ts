import { IOrderItem } from "../models/Order";

export const calculateOrderTotalAmount = (orderItems: IOrderItem[]) => {
  return orderItems.reduce((acc, item) => {
    return (
      acc +
      (item.price - (item.price * item.discountPercentage) / 100) *
        item.quantity
    );
  }, 0);
};
