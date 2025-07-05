import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.signUp(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.verifyCode(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resendVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.resendVerificationCode(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.forgotPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.resetPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const requestEmailChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await UserService.requestEmailChange(userId, req.body.newEmail);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const confirmEmailChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await UserService.confirmEmailChange(userId, req.body.code);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await UserService.refreshToken(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


