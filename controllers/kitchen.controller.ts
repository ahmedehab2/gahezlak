import { RequestHandler } from "express";
import {
  getKitchenOrders,
  updateKitchenOrderStatus,
} from "../services/kitchen.service";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { io } from "../sockets/socketServer";

export const getKitchenOrdersHandler: RequestHandler = async (req, res) => {
  const shopId = req.params.shopId;
  const orders = await getKitchenOrders(shopId);

  const response: SuccessResponse<typeof orders> = {
    message: "Kitchen orders retrieved successfully",
    data: orders,
  };

  res.status(200).json(response);
};

export const updateKitchenOrderStatusHandler: RequestHandler = async (
  req,
  res
) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const updatedOrder = await updateKitchenOrderStatus(orderId, status);
  io.emit("kitchenOrderStatusUpdated", updatedOrder);

  const response: SuccessResponse<typeof updatedOrder> = {
    message: "Kitchen order status updated successfully",
    data: updatedOrder,
  };

  res.status(200).json(response);
};
