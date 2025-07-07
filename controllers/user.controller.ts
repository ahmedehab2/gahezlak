import { Request, Response, NextFunction } from 'express';
import {
  signUp,
  verifyCode,
  resendVerificationCode,
  login,
  forgotPassword,
  resetPassword,
  requestEmailChange,
  confirmEmailChange,
  refreshToken
} from '../services/user.service';

export const signUpHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await signUp(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyCodeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await verifyCode(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resendVerificationCodeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await resendVerificationCode(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await forgotPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await resetPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const requestEmailChangeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await requestEmailChange(userId, req.body.newEmail);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const confirmEmailChangeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await confirmEmailChange(userId, req.body.code);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await refreshToken(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


