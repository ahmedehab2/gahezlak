import { Router } from 'express';
import {
  signUpHandler,
  verifyCodeHandler,
  resendVerificationCodeHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  requestEmailChangeHandler,
  confirmEmailChangeHandler,
  refreshTokenHandler
} from '../controllers/user.controller';
import {
  validateRegister,
  validateVerifyCode,
  validateResendVerificationCode,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRequestEmailChange,
  validateConfirmEmailChange,
  validateRefreshToken
} from '../validators/user.validator';
import { protect } from '../middlewares/auth';

const router = Router();

// Registration route
router.post('/register', validateRegister, signUpHandler);

// Login route
router.post('/login', validateLogin, loginHandler);

// Verification code route
router.post('/verify-code', validateVerifyCode, verifyCodeHandler);

// Resend verification code route
router.post('/resend-verification-code', validateResendVerificationCode, resendVerificationCodeHandler);

// Forgot password route
router.post('/forgot-password', validateForgotPassword, forgotPasswordHandler);

// Reset password route
router.post('/reset-password', validateResetPassword, resetPasswordHandler);

// Request email change route
router.post('/request-email-change', protect, validateRequestEmailChange, requestEmailChangeHandler);

// Confirm email change route
router.post('/confirm-email-change', protect, validateConfirmEmailChange, confirmEmailChangeHandler);

// Refresh token route
router.post('/refresh', validateRefreshToken, refreshTokenHandler);

export default router;
