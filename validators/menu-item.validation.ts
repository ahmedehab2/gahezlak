import { body, param } from 'express-validator';
import { validate } from '../middlewares/validators';

export const validateCreateMenuItem = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean'),
  validate,
];

export const validateUpdateMenuItem = [
  param('shopId').isMongoId().withMessage('Invalid shopId'),
  param('itemId').isMongoId().withMessage('Invalid itemId'),
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().isString(),
  body('isAvailable').optional().isBoolean(),
  validate,
];
