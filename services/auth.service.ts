import { hash, compare } from "bcryptjs";
import { IUser, Users } from "../models/User";
import { sendEmail } from "../utils/sendEmail";
import otpGenerator from "otp-generator";
import jwt from "jsonwebtoken";
import { IRole, Role, Roles } from "../models/Role";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";

// Utility functions
async function findUserByEmail(
  email: string,
  includePassword = false,
  includeRole = true
) {
  const normalizedEmail = email.toLowerCase();
  let query = Users.findOne({ email: normalizedEmail });

  if (includePassword) {
    query = query.select("+password");
  }

  if (includeRole) {
    query = query.populate("role");
  }

  const user = await query.lean();
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }
  return user;
}

async function generateVerificationCode(
  reason: "account_verification" | "password_reset"
) {
  const code = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  return {
    code,
    expireAt,
    reason,
  };
}

export async function signUp(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}) {
  const { firstName, lastName, email, password, phoneNumber } = userData;

  // Hash password
  const hashedPassword = await hash(
    password,
    parseInt(process.env.saltRounds || "7")
  );

  const userRole = await Roles.findOne({ name: Role.USER });
  if (!userRole) {
    throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND);
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
    role: userRole._id,
  };

  // Create user in database
  const {
    password: userPassword,
    role,
    verificationCode,
    refreshToken,
    ...user
  } = await Users.create(newUser);

  // Send verification email only after successful user creation in a separate thread
  setImmediate(() => {
    sendEmail(
      email,
      "Your Verification Code",
      `Your verification code is: <b>${code}</b>. It will expire in 10 minutes.`
    ).catch(console.error);
  });

  return user;
}

export async function verifyCode(verificationData: {
  email: string;
  code: string;
  reason: string;
}) {
  const { code, reason } = verificationData;
  const user = await findUserByEmail(verificationData.email);

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

  const { accessToken, refreshToken } = await generateTokens(user);

  // Combine updates into a single operation
  await Users.findByIdAndUpdate(user._id, {
    $set: {
      isVerified: true,
      verificationCode: { code: null, expireAt: null, reason: null },
      refreshToken,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: true,
      shop: user.shop,
    },
  };
}

export async function resendVerificationCode(userData: { email: string }) {
  const user = await findUserByEmail(userData.email);

  if (user.isVerified) {
    throw new Errors.BadRequestError(errMsg.USER_ALREADY_VERIFIED);
  }

  const verificationCode = await generateVerificationCode(
    "account_verification"
  );

  // Combine into single operation
  await Users.findByIdAndUpdate(user._id, {
    $set: { verificationCode },
  });

  setImmediate(() => {
    sendEmail(
      user.email,
      "Your New Verification Code",
      `Your new verification code is: <b>${verificationCode.code}</b>. It will expire in 10 minutes.`
    );
  });

  return { message: "A new verification code has been sent to your email." };
}

export async function login(loginData: { email: string; password: string }) {
  const { email, password } = loginData;

  // Find user with password included
  const user = await findUserByEmail(email, true);

  if (!user.isVerified) {
    throw new Errors.UnauthenticatedError(errMsg.ACCOUNT_NOT_VERIFIED);
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw new Errors.UnauthorizedError(errMsg.INVALID_EMAIL_OR_PASSWORD);
  }

  const { accessToken, refreshToken } = await generateTokens(user);

  // Update refresh token in single operation
  await Users.findByIdAndUpdate(user._id, { refreshToken });

  const {
    password: userPassword,
    role,
    verificationCode,
    refreshToken: userRefreshToken,
    newEmail,
    ...userData
  } = user;

  return {
    accessToken,
    refreshToken,
    user: userData,
  };
}

export async function forgotPassword(userData: { email: string }) {
  const user = await findUserByEmail(userData.email);
  const verificationCode = await generateVerificationCode("password_reset");

  await Users.findByIdAndUpdate(user._id, {
    $set: { verificationCode },
  });

  setImmediate(() => {
    sendEmail(
      user.email,
      "Your Password Reset Code",
      `Your password reset code is: <b>${verificationCode.code}</b>. It will expire in 10 minutes.`
    );
  });
  return { message: "A password reset code has been sent to your email." };
}

export async function resetPassword(resetData: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const { code, newPassword } = resetData;
  const email = resetData.email.toLowerCase();
  const user = await Users.findOne({ email }).lean();
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

  await Users.findByIdAndUpdate(user._id, {
    $set: {
      password: hashedPassword,
      verificationCode: { code: null, expireAt: null, reason: null },
      refreshToken: "",
    },
  });

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

    const user = await Users.findById(decoded.userId).populate("role").lean();
    if (!user || user.refreshToken !== refreshTokenValue) {
      throw new Errors.UnauthenticatedError(
        errMsg.INVALID_OR_EXPIRED_REFRESH_TOKEN
      );
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    await Users.findByIdAndUpdate(user._id, { refreshToken });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new Errors.UnauthenticatedError(
      errMsg.INVALID_OR_EXPIRED_REFRESH_TOKEN
    );
  }
}

export async function signOut(userId: string) {
  const user = await Users.findByIdAndUpdate(userId, { refreshToken: "" });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  return { message: "Successfully signed out from all devices." };
}

export async function generateTokens(user: IUser) {
  const accessToken = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: (user.role as IRole)?.name,
      shopId: user.shop?._id.toString(),
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return {
    accessToken,
    refreshToken,
  };
}
