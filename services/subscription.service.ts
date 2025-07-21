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

  const isTrialUsed = !!(await Subscriptions.exists({
    userId: subscription.userId,
    isTrialUsed: true,
  }));

  const currentPeriodEnd = isTrialUsed
    ? new Date(
        Date.now() +
          ((subscription.plan as IPlan).frequency === "monthly"
            ? 30 * 24 * 60 * 60 * 1000
            : 365 * 24 * 60 * 60 * 1000)
      )
    : new Date(
        Date.now() +
          (subscription.plan as IPlan).trialPeriodDays * 24 * 60 * 60 * 1000
      );

  // Create the new subscription
  const newSubscription = await Subscriptions.create({
    ...subscription,
    status: isTrialUsed
      ? SubscriptionStatus.ACTIVE
      : SubscriptionStatus.TRIALING,
    currentPeriodStart: new Date(),
    currentPeriodEnd,
  });

  return newSubscription;
}

// Cancel subscription
export async function cancelSubscription(
  userId: string
): Promise<ISubscription> {
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

  // Check if subscription can be cancelled (not expired)
  if (subscription.status === SubscriptionStatus.EXPIRED) {
    throw new Errors.BadRequestError(errMsg.SUBSCRIPTION_CANNOT_BE_CANCELLED);
  }

  // Update subscription status to cancelled
  subscription.status = SubscriptionStatus.CANCELLED;
  subscription.cancelledAt = new Date();
  await subscription.save();

  return subscription;
}

// Cancel subscription in paymob
export async function cancelSubscriptionInPaymob(subscriptionId: string) {
  const subscription = await Subscriptions.findById(subscriptionId);
  if (!subscription) {
    throw new Errors.NotFoundError(errMsg.SUBSCRIPTION_NOT_FOUND);
  }
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
