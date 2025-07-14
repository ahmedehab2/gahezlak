import { RequestHandler } from "express";
import {
  GetKitchenOrders,
  UpdateKitchenOrderStatus,
} from "../services/kitchen.service";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { io } from "../sockets/socketServer";

export const GetKitchenOrdersController: RequestHandler = async (req, res) => {
   const shopId = req.params.shopId;
  const orders = await GetKitchenOrders(shopId);

  const response: SuccessResponse<typeof orders> = {
    message: "Kitchen orders retrieved successfully",
    data: orders,
  };

  res.status(200).json(response);
};

export const UpdateKitchenOrderStatusController: RequestHandler = async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const updatedOrder = await UpdateKitchenOrderStatus(orderId, status);
  // io.emit("kitchenOrderStatusUpdated", updatedOrder);

  const response: SuccessResponse<typeof updatedOrder> = {
    message: "Kitchen order status updated successfully",
    data: updatedOrder,
  };

  res.status(200).json(response);
};
