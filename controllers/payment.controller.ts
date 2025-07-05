import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';

// GET /payments/history - Get user's payment history
export const getPaymentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const payments = await PaymentService.getPaymentHistory(userId);
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

// GET /payments/:id - Get specific payment details
export const getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await PaymentService.getPaymentById(id);
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
}; 