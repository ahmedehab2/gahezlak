import {
  CreateOrder,
  UpdateOrderStatus,
  CancelledOrder,
  GetOrdersByShop,
  GetOrderById,
  sendOrderToKitchen,
} from "../services/order.service";
import { NextFunction, Request, Response } from "express";
import { SuccessResponse, PaginatedRespone } from '../types/contoller-response.types';
import { io } from "../../sockets/socketServer";

export const CreateOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderData = req.body;
    const newOrder = await CreateOrder(orderData);
    io.emit("newOrder", newOrder);

    const response: SuccessResponse<typeof newOrder> = {
      message: "Order created successfully",
      data: newOrder
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const UpdateOrderStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const updatedOrderStatus = await UpdateOrderStatus(orderId, status);
    io.emit("orderStatusUpdated", updatedOrderStatus);

    const response: SuccessResponse<typeof updatedOrderStatus> = {
      message: "Order status updated successfully",
      data: updatedOrderStatus
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const CancelledOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const cancelledOrder = await CancelledOrder(orderId, status);
    io.emit("orderCancelled", cancelledOrder);

    const response: SuccessResponse<typeof cancelledOrder> = {
      message: "Order cancelled successfully",
      data: cancelledOrder
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const SendOrderToKitchenController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id;
    const updatedOrder = await sendOrderToKitchen(orderId);
    io.emit("orderSentToKitchen", updatedOrder);

    const response: SuccessResponse<typeof updatedOrder> = {
      message: "Order sent to kitchen successfully",
      data: updatedOrder
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const GetOrdersByShopController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { orders, totalCount } = await GetOrdersByShop(shopId);
    const paginated: PaginatedRespone<typeof orders[number]> = {
      data: orders.slice(skip, skip + limit),
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };

    const response: SuccessResponse<typeof paginated> = {
      message: "Orders retrieved successfully",
      data: paginated
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const GetOrderByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id;
    const order = await GetOrderById(orderId);

    const response: SuccessResponse<typeof order> = {
      message: "Order retrieved successfully",
      data: order
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
