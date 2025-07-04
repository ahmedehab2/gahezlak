import { Router } from 'express';
import { signUp, verifyCode, resendVerificationCode, login, forgotPassword, resetPassword, requestEmailChange, confirmEmailChange, refreshToken } from '../controllers/user.controller';
import { validateRegister, validateVerifyCode, validateResendVerificationCode, validateLogin, validateForgotPassword, validateResetPassword, validateRequestEmailChange, validateConfirmEmailChange, validateRefreshToken } from '../validators/user.validator';
import { protect } from '../middlewares/auth';

const router = Router();

// Registration route
router.post('/register', validateRegister, signUp);

// Login route
router.post('/login', validateLogin, login);

// Verification code route
router.post('/verify-code', validateVerifyCode, verifyCode);

// Resend verification code route
router.post('/resend-verification-code', validateResendVerificationCode, resendVerificationCode);

// Forgot password route
router.post('/forgot-password', validateForgotPassword, forgotPassword);

// Reset password route
router.post('/reset-password', validateResetPassword, resetPassword);

// Request email change route
router.post('/request-email-change', protect, validateRequestEmailChange, requestEmailChange);

// Confirm email change route
router.post('/confirm-email-change', protect, validateConfirmEmailChange, confirmEmailChange);

// Refresh token route
router.post('/refresh', validateRefreshToken, refreshToken);

export default router;
