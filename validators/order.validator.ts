import { body, param } from "express-validator";
import { validate } from "../middlewares/validators";
import { OrderStatus } from "../models/Order";

export const validateCreateOrder = [
  body("shopName")
    .isString()
    .withMessage("Invalid shopName")
    .isLength({ min: 1 })
    .withMessage("shopName must be at least 1 character"),
  body("tableNumber")
    .optional()
    .isInt({ min: 1 })
    .withMessage("tableNumber must be a positive integer"),
  body("orderItems")
    .isArray({ min: 1 })
    .withMessage("Order items must be a non-empty array"),
  body("orderItems.*.menuItem").isMongoId().withMessage("Invalid menuItemId"),
  body("orderItems.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("orderItems.*.customizationDetails").optional().isString(),

  body("customerFirstName")
    .isString()
    .withMessage("Invalid customerFirstName")
    .isLength({ min: 3 })
    .withMessage("customerFirstName must be at least 3 character"),
  body("customerLastName")
    .isString()
    .withMessage("Invalid customerLastName")
    .isLength({ min: 3 })
    .withMessage("customerLastName must be at least 3 character"),
  body("customerPhoneNumber")
    .isString()
    .withMessage("Invalid customerPhoneNumber"),
  validate,
];

export const validateUpdateOrderStatus = [
  body("status")
    .isIn(Object.values(OrderStatus))
    .withMessage(
      `Status must be one of: ${Object.values(OrderStatus).join(", ")}`
    ),
  validate,
];

export const validateOrderId = [
  param("orderId").isMongoId().withMessage("Invalid order ID"),
  validate,
];

export const validateOrderNumber = [
  param("orderNumber").isInt().withMessage("Invalid order number").toInt(),
  validate,
];
