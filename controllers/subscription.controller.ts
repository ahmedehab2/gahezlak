import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';

// POST /subscriptions/subscribe
export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await SubscriptionService.subscribe(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// POST /subscriptions/cancel
export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await SubscriptionService.cancelSubscription(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /subscriptions/status
export const getSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await SubscriptionService.getSubscriptionStatus(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /subscriptions (admin/dashboard)
export const getAllSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, plan, status } = req.query;
    const filters = { userId: userId as string, plan: plan as string, status: status as string };
    const result = await SubscriptionService.getAllSubscriptions(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}; 