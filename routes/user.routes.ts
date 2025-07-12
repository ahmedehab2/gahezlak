import { Router } from "express";
import {
  signUpHandler,
  verifyCodeHandler,
  resendVerificationCodeHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  requestEmailChangeHandler,
  confirmEmailChangeHandler,
  refreshTokenHandler,
  signOutHandler,
} from "../controllers/user.controller";
import {
  validateRegister,
  validateVerifyCode,
  validateResendVerificationCode,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRequestEmailChange,
  validateConfirmEmailChange,
  validateRefreshToken,
  validateSignOut,
} from "../validators/user.validator";
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
router.post(
  "/request-email-change",
  protect,
  validateRequestEmailChange,
  requestEmailChangeHandler
);
router.post(
  "/confirm-email-change",
  protect,
  validateConfirmEmailChange,
  confirmEmailChangeHandler
);
router.post("/refresh", validateRefreshToken, refreshTokenHandler);
router.post("/signout", protect, validateSignOut, signOutHandler);

export default router;
