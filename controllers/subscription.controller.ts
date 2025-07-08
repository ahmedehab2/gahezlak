import { Request, Response, NextFunction } from 'express';
import {
  subscribe,
  cancelSubscription,
  getSubscriptionStatus,
  getAllSubscriptions
} from '../services/subscription.service';

// POST /subscriptions/subscribe
export const subscribeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await subscribe(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// POST /subscriptions/cancel
export const cancelSubscriptionHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await cancelSubscription(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /subscriptions/status
export const getSubscriptionStatusHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await getSubscriptionStatus(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /subscriptions (admin/dashboard)
export const getAllSubscriptionsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, plan, status } = req.query;
    const filters = { userId: userId as string, plan: plan as string, status: status as string };
    const result = await getAllSubscriptions(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}; 