import { Plans } from '../models/Plan';

export class PlanService {
  static async getPlans() {
    const plans = await Plans.find({ isActive: true }).sort({ price: 1 });
    return plans;
  }
} 