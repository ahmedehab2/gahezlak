import { Orders, IOrder, OrderStatus } from '../models/Order';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';
import mongoose from 'mongoose';

export async function CreateOrder(orderData: Partial<IOrder>) {
  const newOrder = await Orders.create(orderData);
  return newOrder.toObject();
}

export async function UpdateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const order = await Orders.findById(orderId);
  if (!order) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }

  const currentStatus = order.orderStatus;

  const statusFlow: OrderStatus[] = [
    OrderStatus.Pending,
    OrderStatus.Confirmed,
    OrderStatus.InProgress,
    OrderStatus.Preparing,
    OrderStatus.Ready,
    OrderStatus.Delivered,
  ];

  const currentIndex = statusFlow.indexOf(currentStatus);
  const newIndex = statusFlow.indexOf(newStatus);

  const isCancel = newStatus === OrderStatus.Cancelled;

  // If trying to cancel after InProgress → disallowed
  if (isCancel && currentStatus === OrderStatus.InProgress) {
    throw new Errors.BadRequestError({
      en: "Can't cancel after InProgress",
      ar: "لا يمكن إلغاء بعد التحضير",
    });
  }

  // Cancel is only allowed from Pending or Confirmed
  if (isCancel && ![OrderStatus.Pending, OrderStatus.Confirmed].includes(currentStatus)) {
    throw new Errors.BadRequestError({
      en: "Can only cancel from Pending or Confirmed",
      ar: " يمكن إلغاء من الحالة المعلقة أو المؤكدة فقط", 
    });
  }

  // Prevent downgrading or invalid jumps (except for Cancelled)
  if (!isCancel && (newIndex <= currentIndex || newIndex === -1)) {
    throw new Errors.BadRequestError({
      en:"Invalid status transition",
      ar:"انتقال الحالة غير صالح",
    }
    );
  }

  order.orderStatus = newStatus;
  await order.save();

  return order.toObject();
}



export async function sendOrderToKitchen(orderId: string) {
  const updatedOrder = await Orders.findByIdAndUpdate(
    orderId,
    { sentToKitchen: true },
    { new: true }
  );

  if (!updatedOrder) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }

  return updatedOrder.toObject();
}

export async function GetOrdersByShop(shopId: string) {
  const orders = await Orders.find({ shopId });
  const totalCount = await Orders.countDocuments({ shopId });
  return { orders: orders.map((order) => order.toObject()), totalCount };
}

export async function GetOrderById(orderId: string) {
  const order = await Orders.findById(orderId);

  if (!order) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }

  return order.toObject();
}

export async function GetOrdersByStatus(status: string, shopId: string) {
  const orders = await Orders.find({ status, shopId });
  const totalCount = await Orders.countDocuments({ status });
  return { orders: orders.map((order) => order.toObject()), totalCount };
}



export async function getKitchenOrders(shopId: string) {
  const orders = await Orders.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    status: OrderStatus.InProgress,
    sentToKitchen: true,
  }).populate('orderItems.menuItemId');

  return orders.map((order) => order.toObject());
}


