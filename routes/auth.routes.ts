import { Router } from "express";
import {
  signUpHandler,
  verifyCodeHandler,
  resendVerificationCodeHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  refreshTokenHandler,
  signOutHandler,
} from "../controllers/auth.controller";
import {
  validateRegister,
  validateVerifyCode,
  validateResendVerificationCode,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
} from "../validators/auth.validator";
import { protect } from "../middlewares/auth";

const router = Router();

router.post("/register", validateRegister, signUpHandler);
router.post("/login", validateLogin, loginHandler);
router.post("/verify-code", validateVerifyCode, verifyCodeHandler);
router.post(
  "/resend-verification-code",
  validateResendVerificationCode,
  resendVerificationCodeHandler
);
router.post("/forgot-password", validateForgotPassword, forgotPasswordHandler);
router.post("/reset-password", validateResetPassword, resetPasswordHandler);
router.post("/refresh", validateRefreshToken, refreshTokenHandler);
router.post("/signout", protect, signOutHandler);

export default router; 