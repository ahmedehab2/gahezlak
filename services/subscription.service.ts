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

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<ISubscription> {
  const subscription = await Subscriptions.findById(subscriptionId);
  
  if (!subscription) {
    throw new Errors.NotFoundError(errMsg.SUBSCRIPTION_NOT_FOUND);
  }

  // Check if already cancelled
  if (subscription.status === SubscriptionStatus.CANCELLED) {
    throw new Errors.BadRequestError(errMsg.SUBSCRIPTION_ALREADY_CANCELLED);
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

// Get user's active subscription
export async function getUserActiveSubscription(userId: string): Promise<ISubscription | null> {
  const subscription = await Subscriptions.findOne({
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PENDING] },
  })
    .populate("plan", "planGroup title description price currency frequency features")
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
export async function getSubscriptionById(subscriptionId: string): Promise<ISubscription | null> {
  const subscription = await Subscriptions.findById(subscriptionId)
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("shop", "name email phoneNumber address")
    .populate("plan", "planGroup title description price currency frequency features");

  return subscription;
}
