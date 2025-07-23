import {
  ISubscription,
  SubscriptionStatus,
  Subscriptions,
} from "../models/Subscription";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { IPlan } from "../models/plan";
import { cancelPaymobSubscription } from "../utils/paymob";
import { strict } from "assert";

export async function createOrUpdatePendingSubscription({
  shopId,
  userId,
  plan,
}: {
  shopId: string;
  userId: string;
  plan: IPlan;
}) {
  // 1. Check for a currently valid subscription (active, trialing, or cancelled-in-grace-period)
  const existingValidSub = await Subscriptions.findOne({
    shop: shopId,
    $or: [
      {
        status: {
          $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
      },
      {
        status: SubscriptionStatus.CANCELLED,
        currentPeriodEnd: { $gt: new Date() },
      },
    ],
  });

  if (existingValidSub) {
    throw new Errors.UnprocessableError(errMsg.USER_ALREADY_SUBSCRIBED);
  }

  const previousSubWithTrial = await Subscriptions.findOne({
    shop: shopId,
    isTrialUsed: true,
  });
  const isEligibleForTrial = plan.trialPeriodDays > 0 && !previousSubWithTrial;
  const effectiveTrialDays = isEligibleForTrial ? plan.trialPeriodDays : 0;

  const now = new Date();
  const periodEnd = new Date(
    now.getTime() + effectiveTrialDays * 24 * 60 * 60 * 1000
  );

  const subscription = await Subscriptions.findOneAndUpdate(
    { shop: shopId },
    {
      $set: {
        userId: userId,
        plan: plan._id,
        status: "pending",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        isTrialUsed: isEligibleForTrial,

        paymobSubscriptionId: undefined,
        paymobTransactionId: undefined,
        cancelledAt: undefined,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { subscription, effectiveTrialDays };
}

// Cancel subscription
export async function cancelSubscription(userId: string) {
  const subscription = await Subscriptions.findOne({
    userId,
    status: {
      $in: [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.TRIALING,
        SubscriptionStatus.PENDING,
        SubscriptionStatus.EXPIRED,
      ],
    },
  });

  if (!subscription) {
    throw new Errors.NotFoundError(errMsg.NO_ACTIVE_SUBSCRIPTION);
  }

  await cancelPaymobSubscription(subscription.paymobSubscriptionId || 1);
}

// Get user's active subscription
export async function getUserActiveSubscription(
  userId: string
): Promise<ISubscription | null> {
  const subscription = await Subscriptions.findOne({
    userId,
    status: {
      $in: [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.TRIALING,
        SubscriptionStatus.PENDING,
      ],
    },
  })
    .populate(
      "plan",
      "planGroup title description price currency frequency features"
    )
    .populate("shop", "name email phoneNumber");

  return subscription;
}

// Get all subscriptions (admin)
export async function getAllSubscriptions(filters: {
  page?: number;
  limit?: number;
  userId?: string;
  status?: SubscriptionStatus;
  planId?: string;
}): Promise<{ subscriptions: ISubscription[]; totalCount: number }> {
  const { page = 1, limit = 10, userId, status, planId } = filters;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter: any = {};
  if (userId) filter.userId = userId;
  if (status) filter.status = status;
  if (planId) filter.plan = planId;

  const subscriptions = await Subscriptions.find(filter)
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("shop", "name email phoneNumber address")
    .populate("plan", "planGroup title description price currency frequency")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalCount = await Subscriptions.countDocuments(filter);

  return {
    subscriptions,
    totalCount,
  };
}

// Get subscription by ID (admin)
export async function getSubscriptionById(
  subscriptionId: string
): Promise<ISubscription | null> {
  const subscription = await Subscriptions.findById(subscriptionId)
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("shop", "name email phoneNumber address")
    .populate(
      "plan",
      "planGroup title description price currency frequency features"
    );

  return subscription;
}
