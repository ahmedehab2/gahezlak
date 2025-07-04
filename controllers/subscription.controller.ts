import { Request, Response, NextFunction } from 'express';
import { Subscriptions } from '../models/Subscription';
import { AppError } from '../utils/classError';
import { asyncHandler } from '../utils/asyncHandler';
import { Plans } from '../models/Plan';
import mongoose from 'mongoose';

// POST /subscriptions/subscribe
export const subscribe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }
  const sub = await Subscriptions.findOne({ userId });
  if (!sub) {
    return next(new AppError('No subscription found for user', 404));
  }
  // For now, upgrade to 'Premium' plan by default
  const premiumPlan = await Plans.findOne({ name: 'Premium', isActive: true });
  if (!premiumPlan) {
    return next(new AppError('Premium plan not found', 500));
  }
  // Cast _id to mongoose.Types.ObjectId for comparison
  const premiumPlanId = new mongoose.Types.ObjectId(String(premiumPlan._id));
  if (sub.plan.equals(premiumPlanId) && sub.status === 'active') {
    res.status(200).json({ message: 'Already subscribed to premium plan.' });
    return;
  }
  // In the future, payment processing will go here
  sub.plan = premiumPlanId;
  sub.status = 'active';
  sub.trialEndsAt = undefined;
  await sub.save();
  res.status(200).json({ message: 'Subscription upgraded to premium plan.' });
});

// POST /subscriptions/cancel
export const cancelSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }
  const sub = await Subscriptions.findOne({ userId });
  if (!sub) {
    return next(new AppError('No subscription found for user', 404));
  }
  sub.status = 'cancelled';
  await sub.save();
  res.status(200).json({ message: 'Subscription cancelled.' });
});

// GET /subscriptions/status
export const getSubscriptionStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }
  const sub = await Subscriptions.findOne({ userId });
  if (!sub) {
    res.status(200).json({ status: 'none', message: 'No subscription found.' });
    return;
  }
  res.status(200).json({
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
  });
});

// GET /subscriptions (admin/dashboard)
export const getAllSubscriptions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Optional: add filters (e.g., by userId, plan, status)
  const { userId, plan, status } = req.query;
  const filter: any = {};
  if (userId) filter.userId = userId;
  if (plan) filter.plan = plan;
  if (status) filter.status = status;
  const subs = await Subscriptions.find(filter).populate('userId', 'name email').populate('shopId', 'name');
  res.status(200).json(subs);
}); 