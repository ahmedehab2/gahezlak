import { Orders, OrderStatus } from '../models/Order';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';
import mongoose from 'mongoose';

export async function getKitchenOrders(shopId: string) {
  const orders = await Orders.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    status: OrderStatus.InProgress,
    sentToKitchen: true,
  }).populate('orderItems.menuItemId');

  return orders.map((order) => order.toObject());
}

export async function updateKitchenOrderStatus(orderId: string, status: string) {
  const order = await Orders.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(orderId),
      sentToKitchen: true,
    },
    { status },
    { new: true }
  );

  if (!order) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }

  return order.toObject();
}
