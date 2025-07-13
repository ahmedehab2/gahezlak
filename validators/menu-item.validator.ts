import { body, param } from "express-validator";
import { validate } from "../middlewares/validators";

export const validateCreateMenuItem = [
  param("shopId").isMongoId().withMessage("Invalid shopId"),
  body("name").isString().notEmpty().withMessage("Name is required"),
  body("description")
    .isString()
    .notEmpty()
    .withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  body("categoryId").isMongoId().withMessage("Invalid categoryId"),
  body("imgUrl").optional().isString(),
  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),
  body("options").optional().isArray().withMessage("Options must be an array"),
  body("options.*.group").isString().withMessage("Option group is required"),
  body("options.*.type")
    .isIn(["single", "multiple"])
    .withMessage("Invalid option type"),
  body("options.*.required")
    .isBoolean()
    .withMessage("Required must be a boolean"),
  body("options.*.choices").isArray().withMessage("Choices must be an array"),
  body("options.*.choices.*.label")
    .isString()
    .withMessage("Choice label is required"),
  body("options.*.choices.*.price")
    .isFloat({ min: 0 })
    .withMessage("Choice price must be non-negative"),
  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be boolean"),
  validate,
];

export const validateUpdateMenuItem = [
  param("shopId").isMongoId().withMessage("Invalid shopId"),
  param("itemId").isMongoId().withMessage("Invalid itemId"),
  body("name").optional().isString(),
  body("description").optional().isString(),
  body("price").optional().isFloat({ min: 0 }),
  body("categoryId").optional().isMongoId().withMessage("Invalid categoryId"),
  body("imgUrl").optional().isString(),
  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),
  body("options").optional().isArray().withMessage("Options must be an array"),
  body("options.*.group").isString().withMessage("Option group is required"),
  body("options.*.type")
    .isIn(["single", "multiple"])
    .withMessage("Invalid option type"),
  body("options.*.required")
    .isBoolean()
    .withMessage("Required must be a boolean"),
  body("options.*.choices").isArray().withMessage("Choices must be an array"),
  body("options.*.choices.*.label")
    .isString()
    .withMessage("Choice label is required"),
  body("options.*.choices.*.price")
    .isFloat({ min: 0 })
    .withMessage("Choice price must be non-negative"),
  body("isAvailable").optional().isBoolean(),
  validate,
];

export const validateToggleAvailability = [
  param("shopId").isMongoId().withMessage("Invalid shopId"),
  param("itemId").isMongoId().withMessage("Invalid itemId"),
  validate
];

export const validateGetOrDeleteItemById = [
  param("shopId").isMongoId().withMessage("Invalid shopId"),
  param("itemId").isMongoId().withMessage("Invalid itemId"),
  validate
];
