import { body, param } from "express-validator";
import { validate } from "../middlewares/validators";

export const createReportValidation = [
  param("shopName")
    .optional()
    .isString()
    .withMessage("Shop name must be a string"),

  body("senderName")
    .optional()
    .isString()
    .withMessage("Sender name must be a string"),

  body("senderEmail")
    .optional()
    .isEmail()
    .withMessage("Sender email must be a valid email address"),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be between 10 and 1000 characters"),

  validate,
];
