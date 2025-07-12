import bcryptjs from 'bcryptjs';
import { Users } from '../models/User';
import { sendEmail } from '../utils/sendEmail';
import otpGenerator from 'otp-generator';
import jwt from 'jsonwebtoken';
import { Roles } from '../models/Role';
import { Subscriptions } from '../models/Subscription';
import { Errors } from '../errors'
import { errMsg } from '../common/err-messages';
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
  const code = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000);
  const reason = 'account_verification';
  sendEmail(
    email,
    "Your Verification Code",
    `Your verification code is: <b>${code}</b>. It will expire in 10 minutes.`
  );

  const hashedPassword = await hash(password, parseInt(process.env.saltRounds || '7'));

  let roleId;
  if (role) {
    const foundRole = await Roles.findOne({ role: role });
    if (!foundRole) {
      throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND)
    }
    roleId = foundRole._id;
  } else {
    const customerRole = await Roles.findOne({ role: 'customer' });
    if (!customerRole) {
      throw new Errors.NotFoundError(errMsg.ROLE_NOT_FOUND)
    }
    roleId = customerRole._id;
  }

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
    role: roleId
  };

  const createdUser = await Users.create(newUser);
  return;
}









export async function verifyCode(verificationData: { email: string; code: string; reason: string }) {
  const { email, code, reason } = verificationData;
  const user = await Users.findOne({ email: email.toLowerCase() }).populate('role', 'role');
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND)
  }

  const vCode = user.verificationCode;
  if (!vCode.code || !vCode.expireAt || !vCode.reason) {
    throw new Errors.BadRequestError(errMsg.NO_VERIFICATION_CODE_FOUND)
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
      'verificationCode.expireAt': { $lt: now },
      isVerified: false,
      'verificationCode.code': { $ne: null }
    },
    {
      $set: {
        'verificationCode.code': null,
        'verificationCode.expireAt': null,
        'verificationCode.reason': null
      }
    }
  );

  const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  // Store ONLY the new refresh token (invalidate all previous ones)
  user.refreshTokens = [refreshToken];
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }
  };
}









export async function resendVerificationCode(resendData: { email: string; reason: string }) {
  const { email, reason } = resendData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND)
  }
  if (user.isVerified) {
    throw new Errors.BadRequestError(errMsg.USER_ALREADY_VERIFIED);
  }

  // Generate new verification code
  const code = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
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

  return true;
}










export async function login(loginData: { email: string; password: string }) {
  const { email, password } = loginData;
  const user = await Users.findOne({ email: email.toLowerCase() }).populate('role', 'role');
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
  const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  
  // Store ONLY the new refresh token (invalidate all previous ones)
  user.refreshTokens = [refreshToken];
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }
  };
}








export async function forgotPassword(emailData: { email: string }) {
  const { email } = emailData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND)
  }

  // Generate new verification code for password reset
  const code = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  user.verificationCode = { code, expireAt, reason: 'password_reset' };
  await user.save();
  sendEmail(
    email,
    "Password Reset Code",
    `Your password reset code is: <b>${code}</b>. It will expire in 10 minutes.`
  );

  return true;
}






export async function resetPassword(resetData: { email: string; code: string; newPassword: string }) {
  const { email, code, newPassword } = resetData;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND)
  }

  const vCode = user.verificationCode;
  if (!vCode.code || !vCode.expireAt || !vCode.reason) {
    throw new Errors.BadRequestError(errMsg.NO_VERIFICATION_CODE_FOUND);
  }
  if (vCode.code !== code) {
    throw new Errors.BadRequestError(errMsg.INVALID_VERIFICATION_CODE);
  }
  if (vCode.reason !== 'password_reset') {
    throw new Errors.BadRequestError(errMsg.INVALID_VERIFICATION_REASON);
  }
  if (new Date() > new Date(vCode.expireAt)) {
    throw new Errors.BadRequestError(errMsg.VERIFICATION_CODE_EXPIRED);
  }

  const hashedPassword = await bcryptjs.hash(newPassword, parseInt(process.env.saltRounds || '7'));
  user.password = hashedPassword;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  await user.save();

  return true;
}







export async function requestEmailChange(userId: string, newEmail: string) {
  const user = await Users.findById(userId);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND)
  }

  const emailExists = await Users.findOne({ email: newEmail.toLowerCase() });
  if (emailExists) {
    throw new Errors.BadRequestError(errMsg.EMAIL_ALREADY_IN_USE);
  }

  // Generate code for email change
  const code = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000);
  user.verificationCode = { code, expireAt, reason: 'email_change' };
  (user as any).newEmail = newEmail.toLowerCase();
  await user.save();

  // Send code to new email
  const checkEmail = await sendEmail(
    newEmail,
    'Email Change Confirmation',
    `Your email change confirmation code is: <b>${code}</b>. It will expire in 10 minutes.`
  );
  if (!checkEmail) {
    throw new Errors.BadRequestError(errMsg.FAILED_TO_SEND_EMAIL);
  }

  return true;
}







export async function confirmEmailChange(userId: string, code: string) {
  const user = await Users.findById(userId);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND)
  }

  const vCode = user.verificationCode;
  const newEmail = (user as any).newEmail;
  if (!vCode.code || !vCode.expireAt || !vCode.reason || !newEmail) {
    throw new Errors.BadRequestError(errMsg.NO_EMAIL_CHANGE_REQUEST_FOUND);
  }
  if (vCode.code !== code) {
    throw new Errors.BadRequestError(errMsg.INVALID_CONFIRMATION_CODE);
  }
  if (vCode.reason !== 'email_change') {
    throw new Errors.BadRequestError(errMsg.INVALID_CONFIRMATION_REASON);
  }
  if (new Date() > new Date(vCode.expireAt)) {
    throw new Errors.BadRequestError(errMsg.CONFIRMATION_CODE_EXPIRED);
  }

  user.email = newEmail;
  (user as any).newEmail = undefined;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  await user.save();

  return {
    email: user.email
  };
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
  if (!user || !user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
    throw new Errors.UnauthorizedError(errMsg.REFRESH_TOKEN_NOT_RECOGNIZED);
  }

  // Generate new tokens
  const newAccessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const newRefreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  // Token rotation: Replace old refresh token with new one
  user.refreshTokens = [newRefreshToken];
  await user.save();

  return { 
    accessToken: newAccessToken, 
    refreshToken: newRefreshToken 
  };
}

export async function signOut(userId: string) {
  const user = await Users.findById(userId);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  // Clear all refresh tokens for this user (sign out from all devices)
  user.refreshTokens = [];
  await user.save();

  return;
}