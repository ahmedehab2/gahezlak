import { Request, Response, NextFunction } from 'express';
import { PlanService } from '../services/plan.service';

export const getPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PlanService.getPlans();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}; 