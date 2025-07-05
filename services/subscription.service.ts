import { Subscriptions } from '../models/Subscription';
import { AppError } from '../utils/classError';
import { Plans } from '../models/Plan';
import mongoose from 'mongoose';

export class SubscriptionService {
  static async subscribe(userId: string) {
    const sub = await Subscriptions.findOne({ userId });
    if (!sub) {
      throw new AppError('No subscription found for user', 404);
    }
    
    // For now, upgrade to 'Premium' plan by default
    const premiumPlan = await Plans.findOne({ name: 'Premium', isActive: true });
    if (!premiumPlan) {
      throw new AppError('Premium plan not found', 500);
    }
    
    // Cast _id to mongoose.Types.ObjectId for comparison
    const premiumPlanId = new mongoose.Types.ObjectId(String(premiumPlan._id));
    if (sub.plan.equals(premiumPlanId) && sub.status === 'active') {
      return { message: 'Already subscribed to premium plan.' };
    }
    
    // In the future, payment processing will go here
    sub.plan = premiumPlanId;
    sub.status = 'active';
    sub.trialEndsAt = undefined;
    await sub.save();
    
    return { message: 'Subscription upgraded to premium plan.' };
  }

  static async cancelSubscription(userId: string) {
    const sub = await Subscriptions.findOne({ userId });
    if (!sub) {
      throw new AppError('No subscription found for user', 404);
    }
    
    sub.status = 'cancelled';
    await sub.save();
    
    return { message: 'Subscription cancelled.' };
  }

  static async getSubscriptionStatus(userId: string) {
    const sub = await Subscriptions.findOne({ userId });
    if (!sub) {
      return { status: 'none', message: 'No subscription found.' };
    }
    
    return {
      plan: sub.plan,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
    };
  }

  static async getAllSubscriptions(filters: { userId?: string; plan?: string; status?: string }) {
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
} 