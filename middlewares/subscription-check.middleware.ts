import { Request, Response, NextFunction } from "express";
import { Subscriptions, SubscriptionStatus } from "../models/Subscription";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";

export const checkActiveSubscrtion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return next(new Errors.UnauthenticatedError(errMsg.USER_NOT_AUTHENTICATED));
  }
  const sub = await Subscriptions.findOne({ userId });
  if (!sub) {
    return next(new Errors.NotAllowedError(errMsg.NO_SUBSCRIPTION_FOUND));
  }
  if (sub.status === SubscriptionStatus.EXPIRED) {
    return next(
      new Errors.NotAllowedError({
        en: "Your subscription has expired. Please subscribe to continue.",
        ar: "انتهت صلاحية اشتراكك. يرجى الاشتراك للمتابعة.",
      })
    );
  }

  if (
    !sub ||
    (sub.status !== SubscriptionStatus.ACTIVE &&
      sub.status !== SubscriptionStatus.TRIALING)
  ) {
    throw new Errors.NotAllowedError(errMsg.NO_ACTIVE_SUBSCRIPTION);
  }

  next();
};
