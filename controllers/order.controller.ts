import { RequestHandler } from "express";
import * as ShopService from "../services/shop.service";
import {
  CreateOrder,
  UpdateOrderStatus,
  GetOrdersByShop,
  GetOrderById,
  // sendOrderToKitchen,
  GetOrdersByStatus,
  getOrderDetailsByNumber,
} from "../services/order.service";
import {
  SuccessResponse,
  PaginatedRespone,
} from "../common/types/contoller-response.types";

import { getKitchenOrders } from "../services/order.service";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { IOrder, OrderStatus } from "../models/Order";
import { generateOrderNumber } from "../utils/generate-order-number";
import { Role } from "../models/Role";
import { FilterQuery } from "mongoose";
//import { io } from "../sockets/socketServer";

export const createOrderHandler: RequestHandler<
  unknown,
  SuccessResponse<IOrder>,
  Pick<
    IOrder,
    | "tableNumber"
    | "totalAmount"
    | "orderItems"
    | "customerName"
    | "customerPhoneNumber"
  > & {
    shopName: string;
  }
> = async (req, res) => {
  const { shopName, ...orderData } = req.body;
  const shop = await ShopService.getShop({ shopName });
  if (!shop) {
    throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
  }

  const newOrder = await CreateOrder({
    ...orderData,
    shopId: shop._id,
    orderNumber: await generateOrderNumber(shop._id.toString()),
  });
  // io.emit("newOrder", newOrder);

  const paymentUrl = `${process.env.FRONTEND_URL}/payment?orderId=${newOrder._id}`;

  const response: SuccessResponse<typeof newOrder & { paymentUrl: string }> = {
    message: "Order created successfully",
    data: {
      ...newOrder,
      paymentUrl,
    },
  };

  res.status(201).json(response);
};

export const updateOrderStatusHandler: RequestHandler = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { orderId } = req.params;
  const { status } = req.body;
  const updatedOrderStatus = await UpdateOrderStatus(shopId, orderId, status);
  // io.emit("orderStatusUpdated", updatedOrderStatus);

  const response: SuccessResponse<typeof updatedOrderStatus> = {
    message: "Order status updated successfully",
    data: updatedOrderStatus,
  };

  res.status(200).json(response);
};

// export const sendOrderToKitchenHandler: RequestHandler = async (req, res) => {
//   const shopId = req.user?.shopId!;
//   const orderId = req.params.orderId;
//   const updatedOrder = await sendOrderToKitchen(shopId, orderId);
//   // io.emit("orderSentToKitchen", updatedOrder);

//   const response: SuccessResponse<typeof updatedOrder> = {
//     message: "Order sent to kitchen successfully",
//     data: updatedOrder,
//   };

//   res.status(200).json(response);
// };

export const getOrdersByShopHandler: RequestHandler<
  unknown,
  PaginatedRespone<IOrder>,
  any
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const query: FilterQuery<IOrder> = {};

  if (req.user?.role === Role.KITCHEN) {
    query.isSentToKitchen = true;
    query.orderStatus = { $in: [OrderStatus.Pending, OrderStatus.Confirmed] };
  }

  const { orders, totalCount } = await GetOrdersByShop({
    shopId,
    query,
    skip,
    limit,
  });

  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    message: "Orders retrieved successfully",
    data: orders,
    total: totalCount,
    page,
    totalPages,
  });
};

export const getOrderByIdHandler: RequestHandler = async (req, res) => {
  const orderId = req.params.orderId;
  const order = await GetOrderById(orderId);

  const response: SuccessResponse<typeof order> = {
    message: "Order retrieved successfully",
    data: order,
  };

  res.status(200).json(response);
};

export const getOrderDetailsByNumberHandler: RequestHandler<
  {
    orderNumber: string;
  },
  SuccessResponse<
    Pick<IOrder, "orderNumber" | "orderStatus" | "totalAmount" | "createdAt">
  >,
  any
> = async (req, res) => {
  const { orderNumber } = req.params;
  const order = await getOrderDetailsByNumber(Number(orderNumber));

  res.status(200).json({
    message: "Order details retrieved successfully",
    data: {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    },
  });
};
