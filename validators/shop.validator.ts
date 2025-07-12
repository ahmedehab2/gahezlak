import { body, param, query } from 'express-validator';
import { validate } from '../middlewares/validators';

export const validateCreateShop = [
    body('name').isString().notEmpty().withMessage('Shop name is required'),
    body('type').isString().notEmpty().withMessage('Shop type is required'),
    body('address').isString().notEmpty().withMessage('Shop address is required'),
    body('phoneNumber').isString().notEmpty().withMessage('Phone number is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    validate,
];

export const validateGetShop = [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    validate,
];

export const validateRegenerateQRCode = [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    body('width').optional().isInt({ min: 100, max: 1000 }).withMessage('Width must be between 100 and 1000'),
    body('margin').optional().isInt({ min: 0, max: 10 }).withMessage('Margin must be between 0 and 10'),
    body('errorCorrectionLevel').optional().isIn(['L', 'M', 'Q', 'H']).withMessage('Error correction level must be L, M, Q, or H'),
    validate,
];

export const validateGetMenuUrl = [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    validate,
];

export const validateGetShopMenu = [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    validate,
]; 