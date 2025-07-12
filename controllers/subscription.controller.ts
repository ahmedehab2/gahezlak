import { Request, Response, NextFunction } from 'express';
import {
  subscribe,
  cancelSubscription,
  getSubscriptionStatus,
  getAllSubscriptions
} from '../services/subscription.service';
import { sendSuccess } from '../utils/responseHelper';

// POST /subscriptions/subscribe
export const subscribeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await subscribe(userId);
    sendSuccess(res, result, 'Subscription successful.');
  } catch (error) {
    next(error);
  }
};

// POST /subscriptions/cancel
export const cancelSubscriptionHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await cancelSubscription(userId);
    sendSuccess(res, result, 'Subscription cancelled.');
  } catch (error) {
    next(error);
  }
};

// GET /subscriptions/status
export const getSubscriptionStatusHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await getSubscriptionStatus(userId);
    sendSuccess(res, result, 'Subscription status retrieved.');
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
    sendSuccess(res, result, 'All subscriptions retrieved.');
  } catch (error) {
    next(error);
  }
}; 