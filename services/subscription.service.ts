import { Subscriptions } from '../models/Subscription';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';
import mongoose from 'mongoose';

export async function subscribe(userId: string) {
  const sub = await Subscriptions.findOne({ userId });
  if (!sub) {
    throw new Errors.NotFoundError(errMsg.NO_SUBSCRIPTION_FOUND);
  }
  sub.status = 'active';
  sub.paidStart = new Date();
  sub.paidEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  await sub.save();
  return { message: 'Subscription activated.' };
}

export async function cancelSubscription(userId: string) {
  const sub = await Subscriptions.findOne({ userId });
  if (!sub) {
    throw new Errors.NotFoundError(errMsg.NO_SUBSCRIPTION_FOUND);
  }
  sub.status = 'expired';
  await sub.save();
  return { message: 'Subscription expired.' };
}

export async function getSubscriptionStatus(userId: string) {
  const sub = await Subscriptions.findOne({ userId });
  if (!sub) {
    return { status: 'none', message: 'No subscription found.' };
  }
  const now = new Date();
  // Auto-expire logic
  if (sub.status === 'trial' && sub.trialEnd < now) {
    sub.status = 'expired';
    await sub.save();
  } else if (sub.status === 'active' && sub.paidEnd && sub.paidEnd < now) {
    sub.status = 'expired';
    await sub.save();
  }
  return {
    status: sub.status,
    trialStart: sub.trialStart,
    trialEnd: sub.trialEnd,
    paidStart: sub.paidStart,
    paidEnd: sub.paidEnd,
  };
}

export async function getAllSubscriptions(filters: { userId?: string; plan?: string; status?: string }) {
  const { userId, plan, status } = filters;
  const filter: any = {};
  if (userId) filter.userId = userId;
  if (plan) filter.plan = plan;
  if (status) filter.status = status;
  const subs = await Subscriptions.find(filter)
    .populate('userId', 'name email')
    .populate('shopId', 'name');
  return subs;
}