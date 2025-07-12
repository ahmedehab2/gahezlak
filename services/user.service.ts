import bcryptjs from "bcryptjs";
import { IUser, Users } from "../models/User";
import { sendEmail } from "../utils/sendEmail";

import otpGenerator from "otp-generator";
import jwt from "jsonwebtoken";
import { Roles } from "../models/Role";
import { Subscriptions } from "../models/Subscription";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
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
} from "../controllers/user.controller";
import mongoose from "mongoose";

const { hash } = bcryptjs;

export async function signUp(
  userData: Pick<
    IUser,
    "firstName" | "lastName" | "email" | "password" | "phoneNumber"
  >
) {
  const { firstName, lastName, email, password, phoneNumber } = userData;

  // Generate verification code
  const code = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const reason = "account_verification";

  // Send code via email (or SMS)
  sendEmail(
    email,
    "Your Verification Code",
    `Your verification code is: <b>${code}</b>. It will expire in 10 minutes.`
  );

  const hashedPassword = await hash(
    password,
    parseInt(process.env.saltRounds || "7")
  );

  // let roleId;
  // if (role) {
  //   // If role is provided, find its ObjectId
  //   const foundRole = await Roles.findOne({ role: role });
  //   if (!foundRole) {
  //     throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);
  //   }
  //   roleId = foundRole._id;
  // } else {
  //   // Default to 'customer' role
  //   const customerRole = await Roles.findOne({ role: "customer" });
  //   if (!customerRole) {
  //     throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);
  //   }
  //   roleId = customerRole._id;
  // }

  const newUser = {
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phoneNumber,
    createdAt: new Date(),
    updatedAt: new Date(),
    verificationCode: { code, expireAt, reason },
    isVerified: false,
    // role: roleId,
  };

  const createdUser = await Users.create(newUser);
  // Send code via email (or SMS)
  sendEmail(
    email,
    "Your Verification Code",
    `Your verification code is: <b>${code}</b>. It will expire in 10 minutes.`
  );
  return {
    message:
      "Congrats! You're registered. Please check your email for the verification code.",
  };
}

export async function verifyCode(verificationData: {
  email: string;
  code: string;
  reason: string;
}) {
  const { email, code, reason } = verificationData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  const vCode = user.verificationCode;
  if (!vCode.code || !vCode.expireAt || !vCode.reason) {
    throw new Errors.BadRequestError(errMsg.NO_VERIFICATION_CODE_FOUND);
  }
  if (vCode.code !== code) {
    throw new Errors.BadRequestError(errMsg.INVALID_VERIFICATION_CODE);
  }
  if (vCode.reason !== reason) {
    throw new Errors.BadRequestError(errMsg.INVALID_VERIFICATION_REASON);
  }
  if (new Date() > new Date(vCode.expireAt)) {
    throw new Errors.BadRequestError(errMsg.VERIFICATION_CODE_EXPIRED);
  }

  user.isVerified = true;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  await user.save();

  // Create trial subscription if not exists
  // const existingSub = await Subscriptions.findOne({ userId: user._id });
  // if (!existingSub) {
  //   const now = new Date();
  //   const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  //   await Subscriptions.create({
  //     userId: user._id,
  //     status: 'trial',
  //     trialStart: now,
  //     trialEnd: trialEnd,
  //   });
  // }

  return { message: "Verification successful. Your account is now verified." };
}

export async function resendVerificationCode(resendData: {
  email: string;
  reason: string;
}) {
  const { email, reason } = resendData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }
  if (user.isVerified) {
    throw new Errors.BadRequestError(errMsg.USER_ALREADY_VERIFIED);
  }

  // Generate new verification code
  const code = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  user.verificationCode = { code, expireAt, reason };
  await user.save();

  // Send code via email (or SMS)
  const checkEmail = await sendEmail(
    email,
    "Your New Verification Code",
    `Your new verification code is: <b>${code}</b>. It will expire in 10 minutes.`
  );
  if (!checkEmail) {
    throw new Errors.BadRequestError(errMsg.FAILED_TO_SEND_EMAIL);
  }

  return { message: "A new verification code has been sent to your email." };
}

export async function login(loginData: { email: string; password: string }) {
  const { email, password } = loginData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.UnauthorizedError(errMsg.INVALID_EMAIL_OR_PASSWORD);
  }
  if (!user.isVerified) {
    throw new Errors.UnauthenticatedError(errMsg.ACCOUNT_NOT_VERIFIED);
  }

  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    throw new Errors.UnauthorizedError(errMsg.INVALID_EMAIL_OR_PASSWORD);
  }

  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
  // Store refresh token in user document
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  return { message: "Login successful", accessToken, refreshToken };
}

export async function forgotPassword(emailData: { email: string }) {
  const { email } = emailData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  // Generate new verification code for password reset
  const code = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  user.verificationCode = { code, expireAt, reason: "password_reset" };
  await user.save();

  // Send code via email
  sendEmail(
    email,
    "Password Reset Code",
    `Your password reset code is: <b>${code}</b>. It will expire in 10 minutes.`
  );

  return { message: "A password reset code has been sent to your email." };
}

export async function resetPassword(resetData: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const { email, code, newPassword } = resetData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  const vCode = user.verificationCode;
  if (!vCode.code || !vCode.expireAt || !vCode.reason) {
    throw new Errors.BadRequestError(errMsg.NO_VERIFICATION_CODE_FOUND);
  }
  if (vCode.code !== code) {
    throw new Errors.BadRequestError(errMsg.INVALID_VERIFICATION_CODE);
  }
  if (vCode.reason !== "password_reset") {
    throw new Errors.BadRequestError(errMsg.INVALID_VERIFICATION_REASON);
  }
  if (new Date() > new Date(vCode.expireAt)) {
    throw new Errors.BadRequestError(errMsg.VERIFICATION_CODE_EXPIRED);
  }

  const hashedPassword = await bcryptjs.hash(
    newPassword,
    parseInt(process.env.saltRounds || "7")
  );
  user.password = hashedPassword;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  await user.save();

  return { message: "Password has been reset successfully." };
}

export async function requestEmailChange(userId: string, newEmail: string) {
  const user = await Users.findById(userId);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  const emailExists = await Users.findOne({ email: newEmail.toLowerCase() });
  if (emailExists) {
    throw new Errors.BadRequestError(errMsg.EMAIL_ALREADY_IN_USE);
  }

  // Generate code for email change
  const code = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000);
  user.verificationCode = { code, expireAt, reason: "email_change" };
  (user as any).newEmail = newEmail.toLowerCase();
  await user.save();

  // Send code to new email
  const checkEmail = await sendEmail(
    newEmail,
    "Email Change Confirmation",
    `Your email change confirmation code is: <b>${code}</b>. It will expire in 10 minutes.`
  );
  if (!checkEmail) {
    throw new Errors.BadRequestError(errMsg.FAILED_TO_SEND_EMAIL);
  }

  return { message: "A confirmation code has been sent to your new email." };
}

export async function confirmEmailChange(userId: string, code: string) {
  const user = await Users.findById(userId);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  const vCode = user.verificationCode;
  const newEmail = (user as any).newEmail;
  if (!vCode.code || !vCode.expireAt || !vCode.reason || !newEmail) {
    throw new Errors.BadRequestError(errMsg.NO_EMAIL_CHANGE_REQUEST_FOUND);
  }
  if (vCode.code !== code) {
    throw new Errors.BadRequestError(errMsg.INVALID_CONFIRMATION_CODE);
  }
  if (vCode.reason !== "email_change") {
    throw new Errors.BadRequestError(errMsg.INVALID_CONFIRMATION_REASON);
  }
  if (new Date() > new Date(vCode.expireAt)) {
    throw new Errors.BadRequestError(errMsg.CONFIRMATION_CODE_EXPIRED);
  }

  user.email = newEmail;
  (user as any).newEmail = undefined;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  await user.save();

  return { message: "Email has been updated successfully." };
}

export async function refreshToken(refreshToken: string) {
  if (!refreshToken) {
    throw new Errors.BadRequestError(errMsg.REFRESH_TOKEN_REQUIRED);
  }
  if (!process.env.JWT_SECRET) {
    throw new Errors.DatabaseConnectionError(errMsg.JWT_SECRET_NOT_DEFINED);
  }

  let payload: any;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (err) {
    throw new Errors.UnauthorizedError(errMsg.INVALID_OR_EXPIRED_REFRESH_TOKEN);
  }

  const user = await Users.findById(payload.userId);
  if (
    !user ||
    !user.refreshTokens ||
    !user.refreshTokens.includes(refreshToken)
  ) {
    throw new Errors.UnauthorizedError(errMsg.REFRESH_TOKEN_NOT_RECOGNIZED);
  }

  // Issue new access token
  const newAccessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  return { accessToken: newAccessToken };
}

export async function getUserById(userId: string) {
  const user = await Users.findById(userId).lean();
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }
  return user;
}
