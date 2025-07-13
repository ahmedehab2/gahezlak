import { body } from "express-validator";
import { validate } from "../middlewares/validators";

export const createPlanValidator = [
  body("planGroup")
    .exists()
    .withMessage("planGroup is required")
    .isIn(["Pro", "Starter"])
    .withMessage("planGroup must be Pro or Starter"),
  body("description").exists().withMessage("description is required"),
  body("frequency")
    .exists()
    .withMessage("frequency is required")
    .isIn(["monthly", "yearly"])
    .withMessage("frequency must be monthly or yearly"),
  body("currency")
    .exists()
    .withMessage("currency is required")
    .isIn(["EGP", "USD"])
    .withMessage("currency must be EGP or USD"),
  body("price")
    .exists()
    .withMessage("price is required")
    .isInt({ min: 1 })
    .withMessage("price must be integer"),
  body("features")
    .exists()
    .withMessage("features is required")
    .isArray({ min: 1 })
    .withMessage("features must be array"),
  body("features.*").isString().withMessage("feature must be string"),
  body("trialPeriodDays")
    .exists()
    .withMessage("trialPeriodDays is required")
    .isInt({ min: 1 })
    .withMessage("trialPeriodDays must be integer"),
  validate,
];
