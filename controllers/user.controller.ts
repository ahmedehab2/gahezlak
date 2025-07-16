import { RequestHandler } from "express";
import { SuccessResponse } from "../common/types/contoller-response.types";
import {
  requestEmailChange,
  confirmEmailChange,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserByIdAdmin,
  changePassword,
} from "../services/user.service";

export const requestEmailChangeHandler: RequestHandler<
  {},
  SuccessResponse<{}>,
  any
> = async (req, res) => {
  const userId = (req as any).user?.userId;
  await requestEmailChange(userId, req.body.newEmail);
  res.status(200).json({
    message: "A confirmation code has been sent to your new email.",
    data: {},
  });
};

export const confirmEmailChangeHandler: RequestHandler<
  {},
  SuccessResponse<any>,
  any
> = async (req, res) => {
  const userId = (req as any).user?.userId;
  const result = await confirmEmailChange(userId, req.body.code);
  res.status(200).json({
    message: "Email has been updated successfully.",
    data: result,
  });
};

export const getUserProfileHandler: RequestHandler<
  {},
  SuccessResponse<any>,
  any
> = async (req, res) => {
  const userId = (req as any).user?.userId;
  const userProfile = await getUserProfile(userId);
  res.status(200).json({
    message: "User profile retrieved successfully",
    data: userProfile,
  });
};

export const updateUserProfileHandler: RequestHandler<
  {},
  SuccessResponse<any>,
  any
> = async (req, res) => {
  const userId = (req as any).user?.userId;
  const result = await updateUserProfile(userId, req.body);
  res.status(200).json({
    message: "Profile updated successfully",
    data: result,
  });
};

export const getAllUsersHandler: RequestHandler<
  {},
  SuccessResponse<any>,
  any
> = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const result = await getAllUsers(
    parseInt(page as string),
    parseInt(limit as string),
    search as string
  );
  res.status(200).json({
    message: "Users retrieved successfully",
    data: result,
  });
};

export const getUserByIdHandler: RequestHandler<
  { id: string },
  SuccessResponse<any>,
  any
> = async (req, res) => {
  const { id } = req.params;
  const user = await getUserByIdAdmin(id);
  res.status(200).json({
    message: "User retrieved successfully",
    data: user,
  });
};

export const changePasswordHandler: RequestHandler<
  {},
  SuccessResponse<{}>,
  {
    oldPassword: string;
    newPassword: string;
  }
> = async (req, res) => {
  const userId = (req as any).user?.userId;
  const { oldPassword, newPassword } = req.body;
  
  const result = await changePassword(userId, oldPassword, newPassword);
  
  res.status(200).json({
    message: "Password changed successfully",
    data: {},
  });
};
