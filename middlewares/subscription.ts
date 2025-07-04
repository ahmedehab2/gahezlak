import { Request, Response, NextFunction } from 'express';
import { Subscriptions } from '../models/Subscription';

export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const sub = await Subscriptions.findOne({ userId });
  if (!sub) {
    return res.status(403).json({ message: 'No subscription found. Please start a trial or subscribe.' });
  }
  if (sub.status === 'cancelled') {
    return res.status(403).json({ message: 'Subscription cancelled. Please subscribe to continue.' });
  }
  if (sub.plan === 'trial' && sub.trialEndsAt && new Date() > new Date(sub.trialEndsAt)) {
    return res.status(403).json({ message: 'Trial expired. Please subscribe to continue.' });
  }
  // If pro or trial is active and not expired
  next();
}; 