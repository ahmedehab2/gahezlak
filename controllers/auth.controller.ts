import { RequestHandler } from "express";
import { SuccessResponse } from "../common/types/contoller-response.types";
import {
  signUp,
  verifyCode,
  resendVerificationCode,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  signOut,
} from "../services/auth.service";

export const signUpHandler: RequestHandler<
  {},
  SuccessResponse<{}>,
  any
> = async (req, res) => {
  await signUp(req.body);
  res.status(201).json({
    message:
      "Registration successful! Please check your email for the verification code.",
    data: {},
  });
};

export const verifyCodeHandler: RequestHandler<
  {},
  SuccessResponse<any>,
  any
> = async (req, res) => {
  const result = await verifyCode(req.body);
  res.status(200).json({
    message: "Verification successful. You are now logged in.",
    data: result,
  });
};

export const resendVerificationCodeHandler: RequestHandler<
  {},
  SuccessResponse<{}>,
  any
> = async (req, res) => {
  await resendVerificationCode(req.body);
  res.status(200).json({
    message: "A new verification code has been sent to your email.",
    data: {},
  });
};

export const loginHandler: RequestHandler<
  {},
  SuccessResponse<any>,
  any
> = async (req, res) => {
  const result = await login(req.body);
  res.status(200).json({
    message: "Login successful",
    data: result,
  });
};

export const forgotPasswordHandler: RequestHandler<
  {},
  SuccessResponse<{}>,
  any
> = async (req, res) => {
  await forgotPassword(req.body);
  res.status(200).json({
    message: "A password reset code has been sent to your email.",
    data: {},
  });
};

export const resetPasswordHandler: RequestHandler<
  {},
  SuccessResponse<{}>,
  any
> = async (req, res) => {
  await resetPassword(req.body);
  res.status(200).json({
    message: "Password has been reset successfully.",
    data: {},
  });
};

export const refreshTokenHandler: RequestHandler<
  {},
  SuccessResponse<any>,
  any
> = async (req, res) => {
  const result = await refreshToken(req.body.refreshToken);
  res.status(200).json({
    message: "Token refreshed successfully",
    data: result,
  });
};

export const signOutHandler: RequestHandler<
  {},
  SuccessResponse<{}>,
  any
> = async (req, res) => {
  const userId = (req as any).user?.userId;
  await signOut(userId);
  res.status(200).json({
    message: "Successfully signed out from all devices.",
    data: {},
  });
}; 