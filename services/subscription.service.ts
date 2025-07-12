import {
  ISubscription,
  SubscriptionStatus,
  Subscriptions,
} from "../models/Subscription";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { IPlan } from "../models/plan";

export async function createSubscription(
  subscription: Pick<ISubscription, "userId" | "shop" | "plan">
) {
  // Check if the user already has an active subscription
  const existingSubscription = await Subscriptions.findOne({
    userId: subscription.userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
  });

  if (existingSubscription) {
    throw new Errors.BadRequestError(errMsg.USER_ALREADY_SUBSCRIBED);
  }

  // Create the new subscription
  const newSubscription = await Subscriptions.create({
    ...subscription,
    status: SubscriptionStatus.TRIALING,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(
      Date.now() +
        (subscription.plan as IPlan).trialPeriodDays * 24 * 60 * 60 * 1000
    ),
  });

  return newSubscription;
}

// export async function cancelSubscription(userId: string) {
//   const sub = await Subscriptions.findOne({ userId });
//   if (!sub) {
//     throw new Errors.NotFoundError(errMsg.NO_SUBSCRIPTION_FOUND);
//   }
//   sub.status = status.EXPIRED;
//   await sub.save();
// }

// export async function getSubscriptionStatus(userId: string) {
//   const sub = await Subscriptions.findOne({ userId });
//   if (!sub) {
//     return { status: "none", message: "No subscription found." };
//   }
//   const now = new Date();
//   // Auto-expire logic
//   if (sub.status === "trial" && sub.trialEnd < now) {
//     sub.status = "expired";
//     await sub.save();
//   } else if (sub.status === "active" && sub.paidEnd && sub.paidEnd < now) {
//     sub.status = "expired";
//     await sub.save();
//   }
//   return {
//     status: sub.status,
//     trialStart: sub.trialStart,
//     trialEnd: sub.trialEnd,
//     paidStart: sub.paidStart,
//     paidEnd: sub.paidEnd,
//   };
// }

// export async function getAllSubscriptions(filters: {
//   userId?: string;
//   plan?: string;
//   status?: string;
// }) {
//   const { userId, plan, status } = filters;
//   const filter: any = {};
//   if (userId) filter.userId = userId;
//   if (plan) filter.plan = plan;
//   if (status) filter.status = status;
//   const subs = await Subscriptions.find(filter)
//     .populate("userId", "name email")
//     .populate("shopId", "name");
//   return subs;
// }
