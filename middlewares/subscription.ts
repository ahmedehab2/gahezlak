import { Request, Response, NextFunction } from "express";
import { Subscriptions } from "../models/Subscription";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";

export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const userId = (req as any).user?.userId;
  // if (!userId) {
  //   return next(new Errors.UnauthenticatedError(errMsg.USER_NOT_AUTHENTICATED));
  // }
  // const sub = await Subscriptions.findOne({ userId });
  // if (!sub) {
  //   return next(new Errors.NotAllowedError(errMsg.NO_SUBSCRIPTION_FOUND));
  // }
  // const now = new Date();
  // // Auto-expire logic
  // if (sub.status === 'trial' && sub.trialEnd < now) {
  //   sub.status = 'expired';
  //   await sub.save();
  // } else if (sub.status === 'active' && sub.paidEnd && sub.paidEnd < now) {
  //   sub.status = 'expired';
  //   await sub.save();
  // }
  // if (sub.status === 'expired') {
  //   return next(new Errors.NotAllowedError({ en: 'Your subscription has expired. Please subscribe to continue.', ar: 'انتهت صلاحية اشتراكك. يرجى الاشتراك للمتابعة.' }));
  // }
  // // Allow if trial or active and not expired
  next();
};
