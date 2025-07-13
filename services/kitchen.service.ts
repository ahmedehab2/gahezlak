import { Orders, OrderStatus } from "../models/Order";
import { Errors } from "../errors";

export const getKitchenOrders = async (shopId: string) => {
  try {
    const orders = await Orders.find({
      shopId,
      isSentToKitchen: true,
      orderStatus: { $ne: OrderStatus.Delivered } //$ne exclude delivered orders to avoid cluttering kitchen view
    }).sort({ createdAt: -1 });

    return orders;
  } catch (error) {
    throw error;
  }
};


export const updateKitchenOrderStatus = async (
  orderId: string,
  status: OrderStatus
) => {
  const allowedStatuses: OrderStatus[] = [
    OrderStatus.Preparing,
    OrderStatus.Ready,
    OrderStatus.Delivered,
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Errors.BadRequestError({
      en: "Invalid kitchen status",
      ar: "حالة غير صالحة من قبل المطبخ",
    });
  }

  const order = await Orders.findById(orderId);
  if (!order) {
    throw new Errors.NotFoundError({
      en: "Order not found",
      ar: "الطلب غير موجود",
    });
  }

  if (!order.isSentToKitchen) {
    throw new Errors.BadRequestError({
      en: "Order has not been sent to the kitchen",
      ar: "الطلب لم يُرسل إلى المطبخ بعد",
    });
  }

  order.orderStatus = status;
  await order.save();

  return order;
};
