import { RequestHandler } from "express";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
// import { createSubscriptionIntent } from "../utils/paymob";
import * as planService from "../services/plan.service";
import * as shopService from "../services/shop.service";
import { Subscriptions, SubscriptionStatus } from "../models/Subscription";
import { Users } from "../models/User";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { Shops } from "../models/Shop";
import * as subscriptionService from "../services/subscription.service";
// import * as subscriptionService from "../services/subscription.service";

export const createSubscriptionHandler: RequestHandler<
  unknown,
  SuccessResponse<{}>,
  {
    planId: string;
  }
> = async (req, res, next) => {
  const { planId } = req.body;
  const userId = req.user?.userId;

  const user = await Users.findById(userId).lean();
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }
  if (!user.shop) {
    throw new Errors.BadRequestError({
      en: "User does not have a shop",
      ar: "المستخدم لا يملك متجر",
    });
  }

  // Check if user has an active subscription
  const existingSubscription = await Subscriptions.findOne({
    userId: user._id,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
  });

  if (existingSubscription) {
    throw new Errors.BadRequestError({
      en: "User already has an active subscription",
      ar: "المستخدم لديه اشتراك نشط بالفعل",
    });
  }
  const plan = await planService.getPlanById(planId);

  const subscription = await Subscriptions.create({
    userId: user._id,
    shop: user.shop,
    plan: plan._id,
    status: SubscriptionStatus.PENDING,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(
      Date.now() + plan.trialPeriodDays * 24 * 60 * 60 * 1000
    ),
  });

  await Shops.updateOne(
    { _id: user.shop },
    {
      $set: {
        subscriptionId: subscription._id,
      },
    }
  );
  // const iframeUrl = await createSubscriptionIntent({
  //   plan,
  //   user,
  //   trialDays: plan.trialPeriodDays,
  // }); // disabled paymob integration for now

  res.status(200).json({
    message: "Subscription created successfully",
    data: {},
  });
};

// Get subscription by ID (admin)
export const getSubscriptionByIdHandler: RequestHandler<
  { subscriptionId: string },
  SuccessResponse<any>,
  {}
> = async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await subscriptionService.getSubscriptionById(subscriptionId);

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
  SuccessResponse<any>,
  {},
  {
    page?: string;
    limit?: string;
    userId?: string;
    status?: SubscriptionStatus;
    planId?: string;
  }
> = async (req, res) => {
  const { page, limit, userId, status, planId } = req.query;

  const result = await subscriptionService.getAllSubscriptions({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    userId,
    status,
    planId,
  });

  res.status(200).json({
    message: "Subscriptions retrieved successfully",
    data: {
      subscriptions: result.subscriptions,
      totalCount: result.totalCount,
      currentPage: page ? parseInt(page) : 1,
      totalPages: Math.ceil(result.totalCount / (limit ? parseInt(limit) : 10)),
    },
  });
};
