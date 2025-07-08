import { Request, Response, NextFunction } from 'express';
import {
  getPaymentHistory,
  getPaymentById
} from '../services/payment.service';

// GET /payments/history - Get user's payment history
export const getPaymentHistoryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const payments = await getPaymentHistory(userId);
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

// GET /payments/:id - Get specific payment details
export const getPaymentByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await getPaymentById(id);
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
}; 