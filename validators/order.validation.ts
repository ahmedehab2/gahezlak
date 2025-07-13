import { body, param } from 'express-validator';
import { validate } from '../middlewares/validators';
import { OrderStatus } from '../models/Order';

export const validateCreateOrder = [
  body('shopId').isMongoId().withMessage('Invalid shopId'),
  body('tableNumber').optional().isInt({ min: 1 }).withMessage('tableNumber must be a positive integer'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number'),
  body('orderItems').isArray({ min: 1 }).withMessage('Order items must be a non-empty array'),
  body('orderItems.*.menuItemId').isMongoId().withMessage('Invalid menuItemId'),
  body('orderItems.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('orderItems.*.customizationDetails').optional().isString(),
  body('orderItems.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  validate,
];

export const validateUpdateOrderStatus = [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status')
    .isIn(Object.values(OrderStatus))
    .withMessage(`Status must be one of: ${Object.values(OrderStatus).join(', ')}`),
  validate,
];
