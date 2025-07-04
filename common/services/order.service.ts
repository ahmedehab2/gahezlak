import { P } from "pino";
import { Orders } from "../../models/Order";
import { IOrder } from "../../models/Order";
import { OrderStatus } from "../../models/Order";

export const CreateOrder = async (orderDate: IOrder) => {
  try {
    const order = new Orders(orderDate);
    return await order.save();
  } catch (error) {
    throw error;
  }
};

export const UpdateOrderStatus = async (
  orderId: string,
  status: OrderStatus
) => {
  try {
    const updatedOrderStatus = await Orders.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );
    return updatedOrderStatus;
  } catch (error) {
    throw error;
  }
};

export const CancelledOrder = async (orderId: string, status: OrderStatus) => {
  try {
    if (status !== "Pending" && status !== "Confirmed") {
      throw new Error(
        "Cannot cancel an order that is already delivered or confirmed"
      );
    }
    const cancelledOrder = await Orders.findByIdAndUpdate(
      orderId,
      { orderStatus: "Cancelled" },
      { new: true }
    );
    return cancelledOrder;
  } catch (error) {
    throw error;
  }
};

export const GetOrdersByShop = async (shopId: string) => {
  try {
    const [orders, totalCount] = await Promise.all([
      Orders.find({ shopId }).sort({ createdAt: -1 }),
      Orders.countDocuments({ shopId }),
    ]);

    return { orders, totalCount };
  } catch (error) {
    throw error;
  }
};

