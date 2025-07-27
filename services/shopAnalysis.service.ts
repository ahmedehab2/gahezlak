import mongoose from "mongoose";
import { Orders, OrderStatus } from "../models/Order";

export async function CanceledOrderRate(shopId: string) {
  const totalOrders = await Orders.countDocuments({ shopId });
  const canceledOrders = await Orders.countDocuments({
    shopId,
    orderStatus: OrderStatus.Cancelled,
  });

  const rate = totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;

  return {
    totalOrders,
    canceledOrders,
    cancellationRate: Number(rate.toFixed(2)),
  }; // convert string to number
}

export async function OrderCountsByDate(
  shopId: string,
  period: "daily" | "monthly" | "yearly"
) {
  const groupId = {
    daily: {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
    },
    monthly: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
    yearly: { year: { $year: "$createdAt" } },
  }[period];

  const ordersPerDate = await Orders.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
    { $group: { _id: groupId, count: { $sum: 1 } } },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  return ordersPerDate;
}

export async function SalesComparison(
  shopId: string,
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
) {
  const sumSales = async (start: Date, end: Date) => {
    const orders = await Orders.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(shopId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    return orders[0]?.total || 0;
  };

  const total1 = await sumSales(start1, end1);
  const total2 = await sumSales(start2, end2);

  let change: number;

  if (total1 === 0 && total2 === 0) {
    change = 0;
  } else if (total1 === 0 && total2 > 0) {
    change = 100;
  } else {
    change = ((total2 - total1) / total1) * 100;
  }

  return { total1, total2, percentageChange: Number(change.toFixed(2)) };
}

export async function BestAndWorstSellers(
  shopId: string,
  limit: number,
  startDate: string,
  endDate: string
) {
  let matchQuery: any = {
    shopId: new mongoose.Types.ObjectId(shopId),
  };
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  const orders = await Orders.aggregate([
    {
      $match: matchQuery,
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.menuItem",
        total: { $sum: "$orderItems.quantity" },
      },
    },
    {
      $lookup: {
        from: "menu_items",
        localField: "_id",
        foreignField: "_id",
        as: "menuItem",
      },
    },
    { $unwind: "$menuItem" },
    {
      $project: {
        _id: 0,
        menuItemId: "$menuItem._id",
        name: "$menuItem.name",
        total: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  const bestSellers = orders.slice(0, limit);
  const worstSellers = orders.slice(-limit).reverse();

  return { bestSellers, worstSellers };
}
