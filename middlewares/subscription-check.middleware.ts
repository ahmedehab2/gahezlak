import { Request, Response, NextFunction } from "express";
import { Subscriptions, SubscriptionStatus } from "../models/Subscription";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { getUserShop } from "../services/shop.service";

export const checkActiveSubscrtion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return next(new Errors.UnauthenticatedError(errMsg.USER_NOT_AUTHENTICATED));
  }

  const shop = await getUserShop(userId);

  const subscription = await Subscriptions.findOne({ shop: shop._id }).lean();
  if (!subscription) {
    return next(new Errors.NotAllowedError(errMsg.NO_SUBSCRIPTION_FOUND));
  }

  if (subscription.status === SubscriptionStatus.EXPIRED) {
    return next(new Errors.NotAllowedError(errMsg.SUBSCRIPTION_EXPIRED));
  }

  if (
    ![SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING].includes(
      subscription.status
    )
  ) {
    return next(new Errors.NotAllowedError(errMsg.NO_ACTIVE_SUBSCRIPTION));
  }

  next();
};
