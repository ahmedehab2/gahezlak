import { Request, Response, NextFunction } from 'express';
import {
  getPaymentHistory,
  getPaymentById
} from '../services/payment.service';
import { sendSuccess } from '../utils/responseHelper';

// GET /payments/history - Get user's payment history
export const getPaymentHistoryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const payments = await getPaymentHistory(userId);
    sendSuccess(res, payments, 'Payment history retrieved.');
  } catch (error) {
    next(error);
  }
};

// GET /payments/:id - Get specific payment details
export const getPaymentByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await getPaymentById(id);
    sendSuccess(res, payment, 'Payment details retrieved.');
  } catch (error) {
    next(error);
  }
}; 