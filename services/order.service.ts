import { Orders, IOrder } from '../models/Order';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';
import mongoose from 'mongoose';

export async function CreateOrder(orderData: Partial<IOrder>) {
  const newOrder = await Orders.create(orderData);
  return newOrder.toObject();
}

export async function UpdateOrderStatus(orderId: string, status: string) {
  const updatedOrder = await Orders.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );

  if (!updatedOrder) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }

  return updatedOrder.toObject();
}

export async function CancelledOrder(orderId: string, status: string) {
  const cancelledOrder = await Orders.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );

  if (!cancelledOrder) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }

  return cancelledOrder.toObject();
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
