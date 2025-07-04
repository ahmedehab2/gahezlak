import { Request, Response, NextFunction } from 'express';
import { Plans } from '../models/Plan';
import { asyncHandler } from '../utils/asyncHandler';

export const getPlans = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const plans = await Plans.find({ isActive: true }).sort({ price: 1 });
  res.status(200).json(plans);
}); 