import { RequestHandler } from "express";
import { getUserShop } from "../services/shop.service";
import {
  CreateOrder,
  UpdateOrderStatus,
  GetOrdersByShop,
  GetOrderById,
  sendOrderToKitchen,
  GetOrdersByStatus,
} from "../services/order.service";
import {
  SuccessResponse,
  PaginatedRespone,
} from "../common/types/contoller-response.types";

import {
  getKitchenOrders,
} from "../services/order.service";
//import { io } from "../sockets/socketServer";


export const createOrderHandler: RequestHandler = async (req, res) => {
  const { shopId } = req.params;
  const orderData = {
    ...req.body,
    shopId,
  };
  const newOrder = await CreateOrder(orderData);
    // io.emit("newOrder", newOrder);

  const paymentUrl = `http://localhost:3000/payment?orderId=${newOrder._id}`; // رابط صفحة الدفع

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
  await getUserShop(req.user?.userId!);
  const {orderId} = req.params;
  const { status } = req.body;
  const updatedOrderStatus = await UpdateOrderStatus(orderId, shopId, status);
  // io.emit("orderStatusUpdated", updatedOrderStatus);

  const response: SuccessResponse<typeof updatedOrderStatus> = {
    message: "Order status updated successfully",
    data: updatedOrderStatus,
  };
console.log('Updating order:', { orderId, shopId, status });
  res.status(200).json(response);
};


export const sendOrderToKitchenHandler: RequestHandler = async (req, res) => {
  const shopId = req.user?.shopId!;
  await getUserShop(req.user?.userId!);
  const orderId = req.params.id;
  const updatedOrder = await sendOrderToKitchen(orderId, shopId);
  // io.emit("orderSentToKitchen", updatedOrder);

  const response: SuccessResponse<typeof updatedOrder> = {
    message: "Order sent to kitchen successfully",
    data: updatedOrder,
  };

  res.status(200).json(response);
};

export const getOrdersByShopHandler: RequestHandler = async (req, res) => {
  const shopId = req.params.shopId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const { orders, totalCount } = await GetOrdersByShop(shopId);

  const paginated: PaginatedRespone<(typeof orders)[number]> = {
    data: orders.slice(skip, skip + limit),
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  };

  const response: SuccessResponse<typeof paginated> = {
    message: "Orders retrieved successfully",
    data: paginated,
  };

  res.status(200).json(response);
};

export const getOrderByIdHandler: RequestHandler = async (req, res) => {
  const orderId = req.params.id;
  const order = await GetOrderById(orderId);

  const response: SuccessResponse<typeof order> = {
    message: "Order retrieved successfully",
    data: order,
  };

  res.status(200).json(response);
};

export const getOrdersByStatusHandler: RequestHandler = async (req, res) => {
  const shopId = req.params.shopId;
  const status = req.body.status;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const { orders, totalCount } = await GetOrdersByStatus(status, shopId);

  const paginated: PaginatedRespone<(typeof orders)[number]> = {
    data: orders.slice(skip, skip + limit),
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  };

  const response: SuccessResponse<typeof paginated> = {
    message: "Orders retrieved successfully",
    data: paginated,
  };

  res.status(200).json(response);
};



export const getKitchenOrdersHandler: RequestHandler = async (req, res) => {
  const shopId = req.params.shopId;
  const orders = await getKitchenOrders(shopId);

  const response: SuccessResponse<typeof orders> = {
    message: "Kitchen orders retrieved successfully",
    data: orders,
  };

  res.status(200).json(response);
};


