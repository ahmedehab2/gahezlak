import { body, param } from "express-validator";
import { validate } from "../middlewares/validators";

export const validateRegister = [
  body("firstName").isString().notEmpty().withMessage("First name is required"),
  body("lastName").isString().notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("phoneNumber")
    .isString()
    .notEmpty()
    .withMessage("Phone number is required"),
  body("role").optional().isString().withMessage("Role must be a string"),
  validate,
];

export const validateVerifyCode = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("code")
    .isString()
    .notEmpty()
    .withMessage("Verification code is required"),
  body("reason").isString().notEmpty().withMessage("Reason is required"),
  validate,
];

export const validateResendVerificationCode = [
  body("email").isEmail().withMessage("Invalid email address"),
  validate,
];

export const validateLogin = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("password").isString().notEmpty().withMessage("Password is required"),
  validate,
];

export const validateForgotPassword = [
  body("email").isEmail().withMessage("Invalid email address"),
  validate,
];

export const validateResetPassword = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("code")
    .isString()
    .notEmpty()
    .withMessage("Verification code is required"),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),
  validate,
];

export const validateRefreshToken = [
  body("refreshToken")
    .isString()
    .notEmpty()
    .withMessage("Refresh token is required"),
  validate,
]; 