import { Orders, IOrder, OrderStatus } from "../models/Order";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import mongoose, { FilterQuery } from "mongoose";
import { IMenuItem, MenuItemModel } from "../models/MenuItem";
import { calculateOrderTotalAmount } from "../utils/calculate-order-total-amount";

export async function CreateOrder(orderData: Partial<IOrder>) {
  const menuItems = await MenuItemModel.find({
    _id: { $in: orderData.orderItems?.map((item) => item.menuItem) },
    isAvailable: true,
    shopId: orderData.shopId,
  });

  if (menuItems.length !== orderData.orderItems?.length) {
    throw new Errors.BadRequestError(errMsg.MENU_ITEM_NOT_FOUND);
  }

  const menuItemMap = new Map<string, IMenuItem>();
  menuItems.forEach((m) => {
    menuItemMap.set(m._id.toString(), m);
  });

  orderData.orderItems.forEach((item) => {
    const menuItem = menuItemMap.get(item.menuItem.toString());
    if (menuItem) {
      item.price = menuItem.price;
      item.discountPercentage = menuItem.discountPercentage;
    }
  });

  const totalAmount = calculateOrderTotalAmount(orderData.orderItems);

  const newOrder = await Orders.create({
    ...orderData,
    totalAmount,
  });
  await newOrder.populate("orderItems.menuItem");

  return newOrder.toObject();
}

// Define valid status transitions
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Preparing, OrderStatus.Cancelled],
  [OrderStatus.Preparing]: [OrderStatus.Ready],
  [OrderStatus.Ready]: [OrderStatus.Delivered],
  [OrderStatus.Delivered]: [],
  [OrderStatus.Cancelled]: [],
};

export async function UpdateOrderStatus(
  shopId: string,
  orderId: string,
  status: OrderStatus
) {
  const order = await Orders.findOne({
    _id: orderId,
    shopId: new mongoose.Types.ObjectId(shopId),
  });

  if (!order) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }

  const currentStatus = order.orderStatus;
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(status)) {
    throw new Errors.BadRequestError({
      en: `Cannot transition from ${currentStatus} to ${status}`,
      ar: `لا يمكن الانتقال من ${currentStatus} إلى ${status}`,
    });
  }

  order.orderStatus = status;
  await order.save();
  return order.toObject();
}

export async function GetOrdersByShop({
  shopId,
  query,
  skip,
  limit,
}: {
  shopId: string;
  query: FilterQuery<IOrder>;
  skip: number;
  limit: number;
}) {
  const orders = await Orders.find({ shopId })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
  const totalCount = await Orders.countDocuments({ shopId, ...query });

  return { orders, totalCount };
}

export async function GetOrderById(orderId: string) {
  const order = await Orders.findById(orderId);

  if (!order) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }

  return order.toObject();
}

export async function GetOrdersByStatus(status: string, shopId: string) {
  const orders = await Orders.find({ orderStatus: status, shopId });
  const totalCount = await Orders.countDocuments({
    orderStatus: status,
    shopId,
  });
  return { orders: orders.map((order) => order.toObject()), totalCount };
}

export async function getKitchenOrders(shopId: string) {
  const orders = await Orders.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    orderStatus: OrderStatus.Preparing,
  }).populate("orderItems.menuItemId");

  return orders.map((order) => order.toObject());
}

export async function getOrderDetailsByNumber(orderNumber: number) {
  const order = await Orders.findOne({ orderNumber }).lean();
  if (!order) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }
  return order;
}
