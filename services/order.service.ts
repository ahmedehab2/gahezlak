import { Orders, IOrder, OrderStatus } from '../models/Order';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';
import mongoose from 'mongoose';
import { Shops } from '../models/Shop';

export async function CreateOrder(orderData: Partial<IOrder>) {
  
  const newOrder = await Orders.create(orderData);
  return newOrder.toObject();
}


export async function UpdateOrderStatus(shopId: string, orderId: string, status: OrderStatus) {

  
  const order = await Orders.findOne({ 
    _id:orderId,
    shopId: new mongoose.Types.ObjectId(shopId) 
  });

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
  const newIndex = statusFlow.indexOf(status);
  const isCancel = status === OrderStatus.Cancelled;

  if (isCancel && currentStatus === OrderStatus.InProgress) {
    throw new Errors.BadRequestError({
      en: "Can't cancel after InProgress",
      ar: "لا يمكن إلغاء بعد التحضير",
    });
  }

  if (isCancel && ![OrderStatus.Pending, OrderStatus.Confirmed].includes(currentStatus)) {
    throw new Errors.BadRequestError({
      en: "Can only cancel from Pending or Confirmed",
      ar: " يمكن إلغاء من الحالة المعلقة أو المؤكدة فقط", 
    });
  }

  if (!isCancel && (newIndex !== currentIndex + 1)) {
    throw new Errors.BadRequestError({
      en:"Invalid status transition",
      ar:"انتقال الحالة غير صالح",
    });
  }

  order.orderStatus = status;
  await order.save();
  return order.toObject();
}

export async function sendOrderToKitchen(shopId: string, orderId: string) {
  const order = await Orders.findOne({
    _id: orderId,
    shopId: new mongoose.Types.ObjectId(shopId)
  });

  if (!order) {
    throw new Errors.NotFoundError(errMsg.ORDER_NOT_FOUND);
  }
  

  if (order.orderStatus !== OrderStatus.InProgress) {
    throw new Errors.BadRequestError({
      en: "Order must be InProgress to send to kitchen",
      ar: "يجب أن يكون الطلب قيد التحضير لإرساله للمطبخ"
    });
  }

  order.isSentToKitchen = true;
  await order.save();
  return order.toObject();
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
  const orders = await Orders.find({ orderStatus: status, shopId });
  const totalCount = await Orders.countDocuments({ orderStatus: status,shopId });
  return { orders: orders.map((order) => order.toObject()), totalCount };
}



export async function getKitchenOrders(shopId: string) {
  const orders = await Orders.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    orderStatus: OrderStatus.InProgress,
    isSentToKitchen: true,
  }).populate('orderItems.menuItemId');

  return orders.map((order) => order.toObject());
}


