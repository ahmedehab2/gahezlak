import { body } from "express-validator";
import { validate } from "../middlewares/validators";
import { PaymentMethods } from "../models/Payment";

export const payForPlanValidator = [
  body("planId").isMongoId().withMessage("Invalid Plan ID"),
  body("paymentMethod")
    .isIn(Object.values(PaymentMethods))
    .withMessage("Invalid Payment Method"),
  body("paymentMethodDetails").isObject(),
  validate,
];

export const payForOrderValidator = [
  body("orderId").isMongoId().withMessage("Invalid Order ID"),
  body("paymentMethod")
    .isIn(Object.values(PaymentMethods))
    .withMessage("Invalid Payment Method"),
  body("paymentMethodDetails").optional(),
  validate,
];
