import { Orders } from '../../models/Order';
import { IOrder, OrderStatus } from '../../models/Order';
import { MenuItemModel } from '../../models/MenuItem';
import { Errors } from '../../errors';

export const CreateOrder = async (orderData: IOrder) => {
  try {
    for (const item of orderData.orderItems) {
      const menuItem = await MenuItemModel.findById(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new Errors.BadRequestError({
          en: `Menu item with ID ${item.menuItemId} is not available`,
          ar: `العنصر بالمُعرف ${item.menuItemId} غير متاح`
        });
      }
    }

    const order = new Orders(orderData);
    return await order.save();
  } catch (error) {
    throw error;
  }
};

export const UpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
  try {
    const updatedOrderStatus = await Orders.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true });
    if (!updatedOrderStatus) {
      throw new Errors.NotFoundError({ en: 'Order not found', ar: 'الطلب غير موجود' });
    }
    return updatedOrderStatus;
  } catch (error) {
    throw error;
  }
};

export const CancelledOrder = async (orderId: string, status: OrderStatus) => {
  try {
    if (status !== 'Pending' && status !== 'Confirmed') {
      throw new Errors.BadRequestError({
        en: 'Cannot cancel an order that is already delivered or confirmed',
        ar: 'لا يمكن إلغاء طلب تم توصيله أو تأكيده بالفعل'
      });
    }
    const cancelledOrder = await Orders.findByIdAndUpdate(orderId, { orderStatus: 'Cancelled' }, { new: true });
    if (!cancelledOrder) {
      throw new Errors.NotFoundError({ en: 'Order not found', ar: 'الطلب غير موجود' });
    }
    return cancelledOrder;
  } catch (error) {
    throw error;
  }
};

export const sendOrderToKitchen = async (orderId: string) => {
  try {
    const order = await Orders.findById(orderId);
    if (!order) {
      throw new Errors.NotFoundError({ en: 'Order not found', ar: 'الطلب غير موجود' });
    }

    if (order.orderStatus !== 'Confirmed') {
      throw new Errors.BadRequestError({
        en: 'Only confirmed orders can be sent to kitchen',
        ar: 'يجب تأكيد الطلب قبل إرساله إلى المطبخ'
      });
    }

    if (order.isSentToKitchen) {
      throw new Errors.BadRequestError({
        en: 'Order already sent to kitchen',
        ar: 'تم إرسال الطلب إلى المطبخ مسبقًا'
      });
    }

    order.isSentToKitchen = true;
    await order.save();

    return order;
  } catch (error) {
    throw error;
  }
};

export const GetOrdersByShop = async (shopId: string) => {
  try {
    const [orders, totalCount] = await Promise.all([
      Orders.find({ shopId }).sort({ createdAt: -1 }),
      Orders.countDocuments({ shopId })
    ]);
    return { orders, totalCount };
  } catch (error) {
    throw error;
  }
};
export const GetOrderById = async (orderId: string) => {
  const order = await Orders.findById(orderId);
  if (!order) {
    throw new Errors.NotFoundError({ en: 'Order not found', ar: 'الطلب غير موجود' });
  }
  return order;
};