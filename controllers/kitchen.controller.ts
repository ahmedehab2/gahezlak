import { Request, Response, NextFunction } from "express";
import {
  getKitchenOrders,
  updateKitchenOrderStatus
} from "../services/kitchen.service";
import { io } from "../sockets/socketServer";
import { SuccessResponse, PaginatedRespone } from '../common/types/contoller-response.types';

export const GetKitchenOrdersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const orders = await getKitchenOrders(shopId);

    const paginated: PaginatedRespone<typeof orders[number]> = {
      data: orders.slice(skip, skip + limit),
      total: orders.length,
      page,
      totalPages: Math.ceil(orders.length / limit),
    };

    const response: SuccessResponse<typeof paginated> = {
      message: "Kitchen orders retrieved",
      data: paginated
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const UpdateKitchenOrderStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const updatedOrder = await updateKitchenOrderStatus(orderId, status);

    io.emit("kitchenOrderStatusUpdated", updatedOrder);

    const response: SuccessResponse<typeof updatedOrder> = {
      message: "Kitchen order status updated",
      data: updatedOrder
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
