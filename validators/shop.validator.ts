import { body, param } from "express-validator";
import { validate } from "../middlewares/validators";

export const shopIdValidator = [
  param("shopId").isInt().withMessage("Shop ID must be an integer"),
  validate,
];

export const creatShopValidator = [
  body("name")
    .isString()
    .withMessage("Shop name must be a string")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Shop name must be at least 3 characters long"),
  body("type").isString().withMessage("Shop type must be a string"),
  body("address").isObject().withMessage("Shop address must be an object"),
  body("address.country")
    .isString()
    .withMessage("Shop address country must be a string"),
  body("address.city")
    .isString()
    .withMessage("Shop address city must be a string"),
  body("address.street")
    .isString()
    .withMessage("Shop address street must be a string"),
  body("phoneNumber")
    .isMobilePhone("ar-EG")
    .withMessage("Shop phone number must be a valid Egyptian mobile number"),
  body("email").isString().withMessage("Shop email must be a string"),
  validate,
];

export const updateShopValidator = [
  param("id").isMongoId().withMessage("Shop ID must be a valid MongoDB ID"),
  body("name")
    .optional()
    .isString()
    .withMessage("Shop name must be a string")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Shop name must be at least 3 characters long"),
  body("address")
    .optional()
    .isObject()
    .withMessage("Shop address must be an object"),
  body("address.country")
    .optional()
    .isString()
    .withMessage("Shop address country must be a string"),
  body("address.city")
    .optional()
    .isString()
    .withMessage("Shop address city must be a string"),
  body("address.street")
    .optional()
    .isString()
    .withMessage("Shop address street must be a string"),
  body("phoneNumber")
    .optional()
    .isMobilePhone("ar-EG")
    .withMessage("Shop phone number must be a valid Egyptian mobile number"),
  body("email")
    .optional()
    .isString()
    .withMessage("Shop email must be a string"),
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
  param('shopName')
    .isString()
    .withMessage('Shop name must be a string')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Shop name must be between 3 and 50 characters'),
  validate,
];

