import bcryptjs from "bcryptjs";
import { Users } from "../models/User";
import { sendEmail } from "../utils/sendEmail";
import otpGenerator from "otp-generator";
import jwt from "jsonwebtoken";
import { Roles } from "../models/Role";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";

const { hash } = bcryptjs;

export async function signUp(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: string;
}) {
  const { firstName, lastName, email, password, phoneNumber, role } = userData;

  // Check if email already exists first (fail fast)
  const existingUser = await Users.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Errors.BadRequestError(errMsg.EMAIL_ALREADY_IN_USE);
  }

  // Hash password
  const hashedPassword = await hash(
    password,
    parseInt(process.env.saltRounds || "7")
  );

  // Get role ID
  let roleId;
  if (role) {
    const foundRole = await Roles.findOne({ role: role });
    if (!foundRole) {
      throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);
    }
    roleId = foundRole._id;
  } else {
    const customerRole = await Roles.findOne({ role: "customer" });
    if (!customerRole) {
      throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);
    }
    roleId = customerRole._id;
  }

  // Generate verification code
  const code = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const reason = "account_verification";

  const newUser = {
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: hashedPassword,
    phoneNumber,
    verificationCode: {
      code,
      expireAt,
      reason,
    },
    role: roleId,
  };

  // Create user in database
  const user = await Users.create(newUser);

  // Send verification email only after successful user creation
  try {
    await sendEmail(
      email,
      "Your Verification Code",
      `Your verification code is: <b>${code}</b>. It will expire in 10 minutes.`
    );
  } catch (emailError) {
    // If email sending fails, delete the created user to maintain consistency
    await Users.findByIdAndDelete(user._id);
    throw new Errors.BadRequestError(errMsg.FAILED_TO_SEND_EMAIL);
  }

  return user;
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

  // Clean up expired verification codes for all users
  const now = new Date();
  await Users.updateMany(
    {
      "verificationCode.expireAt": { $lt: now },
      isVerified: false,
      "verificationCode.code": { $ne: null },
    },
    {
      $set: {
        "verificationCode.code": null,
        "verificationCode.expireAt": null,
        "verificationCode.reason": null,
      },
    }
  );

  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    },
  };
}

export async function resendVerificationCode(userData: { email: string }) {
  const { email } = userData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }
  if (user.isVerified) {
    throw new Errors.BadRequestError(errMsg.USER_ALREADY_VERIFIED);
  }

  const code = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const reason = "account_verification";

  user.verificationCode = {
    code,
    expireAt,
    reason,
  };
  await user.save();

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

  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    },
  };
}

export async function forgotPassword(userData: { email: string }) {
  const { email } = userData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  const code = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const reason = "password_reset";

  user.verificationCode = {
    code,
    expireAt,
    reason,
  };
  await user.save();

  const checkEmail = await sendEmail(
    email,
    "Your Password Reset Code",
    `Your password reset code is: <b>${code}</b>. It will expire in 10 minutes.`
  );
  if (!checkEmail) {
    throw new Errors.BadRequestError(errMsg.FAILED_TO_SEND_EMAIL);
  }

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

  const hashedPassword = await hash(
    newPassword,
    parseInt(process.env.saltRounds || "7")
  );

  user.password = hashedPassword;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  user.refreshToken = ""; // Invalidate existing refresh token
  await user.save();

  return { message: "Password has been reset successfully." };
}

export async function refreshToken(refreshTokenValue: string) {
  if (!refreshTokenValue) {
    throw new Errors.UnauthenticatedError(errMsg.REFRESH_TOKEN_REQUIRED);
  }

  try {
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    const user = await Users.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshTokenValue) {
      throw new Errors.UnauthenticatedError(errMsg.INVALID_OR_EXPIRED_REFRESH_TOKEN);
    }

    const newAccessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );
    const newRefreshToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new Errors.UnauthenticatedError(errMsg.INVALID_OR_EXPIRED_REFRESH_TOKEN);
  }
}

export async function signOut(userId: string) {
  const user = await Users.findById(userId);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  user.refreshToken = "";
  await user.save();

  return { message: "Successfully signed out from all devices." };
} 