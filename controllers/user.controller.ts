import { Request, Response, NextFunction } from 'express';
import { SuccessResponse } from '../common/types/contoller-response.types';
import {
  signUp,
  verifyCode,
  resendVerificationCode,
  login,
  forgotPassword,
  resetPassword,
  requestEmailChange,
  confirmEmailChange,
  refreshToken,
  signOut
} from '../services/user.service';

export const signUpHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await signUp(req.body);
    const response: SuccessResponse<{}> = {
      message: "Registration successful! Please check your email for the verification code.",
      data: {}
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};



export const verifyCodeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await verifyCode(req.body);
    const response: SuccessResponse<typeof result> = {
      message: "Verification successful. You are now logged in.",
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};





export const resendVerificationCodeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await resendVerificationCode(req.body);
    const response: SuccessResponse<{}> = {
      message: "A new verification code has been sent to your email.",
      data: {}
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};





export const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await login(req.body);
    const response: SuccessResponse<typeof result> = {
      message: "Login successful",
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};





export const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await forgotPassword(req.body);
    const response: SuccessResponse<{}> = {
      message: "A password reset code has been sent to your email.",
      data: {}
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};





export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await resetPassword(req.body);
    const response: SuccessResponse<{}> = {
      message: "Password has been reset successfully.",
      data: {}
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};




export const requestEmailChangeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    await requestEmailChange(userId, req.body.newEmail);
    const response: SuccessResponse<{}> = {
      message: "A confirmation code has been sent to your new email.",
      data: {}
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};




export const confirmEmailChangeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await confirmEmailChange(userId, req.body.code);
    const response: SuccessResponse<typeof result> = {
      message: "Email has been updated successfully.",
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};




export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await refreshToken(req.body.refreshToken);
    const response: SuccessResponse<typeof result> = {
      message: "Token refreshed successfully",
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};




export const signOutHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    await signOut(userId);
    const response: SuccessResponse<{}> = {
      message: "Successfully signed out from all devices.",
      data: {}
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};


