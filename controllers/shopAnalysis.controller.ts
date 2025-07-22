import { RequestHandler } from "express";
import {
  CanceledOrderRate,
  OrderCountsByDate,
  SalesComparison,
  BestAndWorstSellers,
} from "../services/shopAnalysis.service";

export const CanceledOrderRateController: RequestHandler = async (req, res) => {
  const canceledOrders = await CanceledOrderRate(req.user!.shopId);
  res.status(200).json({ message: "Cancellation rate retrieved", data: canceledOrders });
};

export const OrderCountsByDateController: RequestHandler = async (req, res) => {
  const { type } = req.query;
  const ordersPerDate = await OrderCountsByDate(req.user!.shopId, type as any);
  res.status(200).json({ message: "Orders count retrieved", data: ordersPerDate });
};

export const SalesComparisonController: RequestHandler = async (req, res) => {
  const { start1, end1, start2, end2 } = req.query;
  const shopId=req.user!.shopId!;
  const salesComparison = await SalesComparison(
    shopId,
    new Date(start1 as string),
    new Date(end1 as string),
    new Date(start2 as string),
    new Date(end2 as string)
  );
  res.status(200).json({ message: "Sales trend retrieved", data: salesComparison });
};

export const BestAndWorstSellersController: RequestHandler = async (req, res) => {
  const { limit } = req.query;
  const shopId=req.user!.shopId!;
  const BestAndWorstOrders = await BestAndWorstSellers(shopId, parseInt(limit as string) || 5);
  res.status(200).json({ message: "Sellers data retrieved", data: BestAndWorstOrders });
};
