import { RequestHandler } from "express";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { createSubscriptionIntent } from "../utils/paymob";
import * as planService from "../services/plan.service";
import { Subscriptions, SubscriptionStatus } from "../models/Subscription";
import { Users } from "../models/User";
import { SuccessResponse } from "../common/types/contoller-response.types";
import * as subscriptionService from "../services/subscription.service";
import { ObjectId } from "mongoose";
import { getUserById } from "../services/user.service";
// import * as subscriptionService from "../services/subscription.service";
import { PaginatedRespone } from "../common/types/contoller-response.types";

export const createSubscriptionHandler: RequestHandler<
  unknown,
  SuccessResponse<{
    iframeUrl: string;
  }>,
  {
    planId: string;
  }
> = async (req, res, next) => {
  const { planId } = req.body;
  const userId = req.user?.userId;

  const user = await getUserById(userId!);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }
  if (!user.shop) {
    throw new Errors.BadRequestError(errMsg.USER_HAS_NO_SHOP);
  }

  const plan = await planService.getPlanById(planId);

  const { effectiveTrialDays } =
    await subscriptionService.createOrUpdatePendingSubscription({
      shopId: user.shop.toString(),
      userId: user._id.toString(),
      plan,
    });

  const { iframeUrl } = await createSubscriptionIntent({
    plan,
    user,
    trialDays: effectiveTrialDays,
    extras: {
      shopId: user.shop.toString(),
      userId: user._id.toString(),
      planId: plan._id.toString(),
    },
  });

  res.status(200).json({
    message: "Subscription created successfully",
    data: {
      iframeUrl,
    },
  });
};

// Get subscription by ID (admin)
export const getSubscriptionByIdHandler: RequestHandler<
  { subscriptionId: string },
  SuccessResponse<any>,
  {}
> = async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await subscriptionService.getSubscriptionById(
    subscriptionId
  );

  if (!subscription) {
    throw new Errors.NotFoundError(errMsg.SUBSCRIPTION_NOT_FOUND);
  }

  res.status(200).json({
    message: "Subscription retrieved successfully",
    data: subscription,
  });
};

// Get all subscriptions (admin)
export const getAllSubscriptionsHandler: RequestHandler<
  {},
  PaginatedRespone<any>,
  {},
  {
    page?: string;
    limit?: string;
    userId?: string;
    status?: SubscriptionStatus;
    planId?: string;
    search?: string;
  }
> = async (req, res) => {
  const { page, limit, userId, status, planId, search = "" } = req.query;
  const pageNum = page ? parseInt(page) : 1;
  const limitNum = limit ? parseInt(limit) : 10;
  const result = await subscriptionService.getAllSubscriptions({
    page: pageNum,
    limit: limitNum,
    userId,
    status,
    planId,
    search,
  });
  res.status(200).json({
    message: "Data retreived.",
    data: result.subscriptions,
    total: result.totalCount,
    page: pageNum,
    totalPages: Math.ceil(result.totalCount / limitNum),
  });
};
