import { Request, Response, NextFunction } from 'express';
import bcryptjs from 'bcryptjs';
import { Users } from '../models/User';
import { sendEmail } from '../utils/sendEmail';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/classError';
import otpGenerator from 'otp-generator';
import jwt from 'jsonwebtoken';
import { Roles } from '../models/Role';
import { Subscriptions } from '../models/Subscription';
import { Plans } from '../models/Plan';

const { hash } = bcryptjs;




export const signUp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, phoneNumber, role } = req.body;

  const userExist = await Users.findOne({ email: email.toLowerCase() });
  if (userExist) {
    return res.status(409).json({ message: "This email is already registered!, please use another email!" });
  }

  // Generate verification code
  const code = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const reason = 'account_verification';

  // Send code via email (or SMS)
  const checkEmail = await sendEmail(
    email,
    "Your Verification Code",
    `Your verification code is: <b>${code}</b>. It will expire in 10 minutes.`
  );
  if (!checkEmail) {
    return next(new AppError("Failed to send email", 409));
  }

  const hashedPassword = await hash(password, parseInt(process.env.saltRounds || '7'));

  let roleId;
  if (role) {
    // If role is provided, find its ObjectId
    const foundRole = await Roles.findOne({ role: role });
    if (!foundRole) {
      return next(new AppError('Invalid role provided', 400));
    }
    roleId = foundRole._id;
  } else {
    // Default to 'customer' role
    const customerRole = await Roles.findOne({ role: 'customer' });
    if (!customerRole) {
      return next(new AppError('Default customer role not found in database', 500));
    }
    roleId = customerRole._id;
  }

  const newUser = {
    name,
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
  return res.status(201).json({ message: "Congrats! You're registered. Please check your email for the verification code.", user: createdUser });
});





export const verifyCode = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, code, reason } = req.body;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const vCode = user.verificationCode;
  if (!vCode.code || !vCode.expireAt || !vCode.reason) {
    return next(new AppError('No verification code found. Please request a new code.', 400));
  }
  if (vCode.code !== code) {
    return next(new AppError('Invalid verification code.', 400));
  }
  if (vCode.reason !== reason) {
    return next(new AppError('Invalid verification reason.', 400));
  }
  if (new Date() > new Date(vCode.expireAt)) {
    return next(new AppError('Verification code has expired.', 400));
  }
  user.isVerified = true;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  await user.save();

  // Create trial subscription if not exists
  const existingSub = await Subscriptions.findOne({ userId: user._id });
  if (!existingSub) {
    // Find the Starter plan
    const starterPlan = await Plans.findOne({ name: 'Starter', isActive: true });
    if (!starterPlan) {
      return next(new AppError('Starter plan not found', 500));
    }
    const trialEndsAt = new Date(Date.now() + starterPlan.duration * 24 * 60 * 60 * 1000);
    await Subscriptions.create({
      userId: user._id,
      plan: starterPlan._id,
      status: 'active',
      trialEndsAt,
    });
  }

  return res.status(200).json({ message: 'Verification successful. Your account is now verified.' });
});






export const resendVerificationCode = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, reason } = req.body;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  if (user.isVerified) {
    return next(new AppError('User is already verified.', 400));
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
    return next(new AppError("Failed to send email", 409));
  }
  return res.status(200).json({ message: 'A new verification code has been sent to your email.' });
});





export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }
  if (!user.isVerified) {
    return next(new AppError('Account is not verified. Please verify your account first.', 403));
  }
  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password', 401));
  }
  if (!process.env.JWT_SECRET) {
    return next(new AppError('JWT_SECRET is not defined in environment variables', 500));
  }
  // Generate access token (short-lived)
  const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  // Store refresh token in user document
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();
  return res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
});





export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  // Generate new verification code for password reset
  const code = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  user.verificationCode = { code, expireAt, reason: 'password_reset' };
  await user.save();
  // Send code via email
  const checkEmail = await sendEmail(
    email,
    "Password Reset Code",
    `Your password reset code is: <b>${code}</b>. It will expire in 10 minutes.`
  );
  if (!checkEmail) {
    return next(new AppError("Failed to send email", 409));
  }
  return res.status(200).json({ message: 'A password reset code has been sent to your email.' });
});





export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, code, newPassword } = req.body;
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const vCode = user.verificationCode;
  if (!vCode.code || !vCode.expireAt || !vCode.reason) {
    return next(new AppError('No verification code found. Please request a new code.', 400));
  }
  if (vCode.code !== code) {
    return next(new AppError('Invalid verification code.', 400));
  }
  if (vCode.reason !== 'password_reset') {
    return next(new AppError('Invalid verification reason.', 400));
  }
  if (new Date() > new Date(vCode.expireAt)) {
    return next(new AppError('Verification code has expired.', 400));
  }
  const hashedPassword = await bcryptjs.hash(newPassword, parseInt(process.env.saltRounds || '7'));
  user.password = hashedPassword;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  await user.save();
  return res.status(200).json({ message: 'Password has been reset successfully.' });
});





export const requestEmailChange = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  const { newEmail } = req.body;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }
  const user = await Users.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const emailExists = await Users.findOne({ email: newEmail.toLowerCase() });
  if (emailExists) {
    return next(new AppError('This email is already in use.', 409));
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
    return next(new AppError('Failed to send email', 409));
  }
  return res.status(200).json({ message: 'A confirmation code has been sent to your new email.' });
});





export const confirmEmailChange = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  const { code } = req.body;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }
  const user = await Users.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const vCode = user.verificationCode;
  const newEmail = (user as any).newEmail;
  if (!vCode.code || !vCode.expireAt || !vCode.reason || !newEmail) {
    return next(new AppError('No email change request found.', 400));
  }
  if (vCode.code !== code) {
    return next(new AppError('Invalid confirmation code.', 400));
  }
  if (vCode.reason !== 'email_change') {
    return next(new AppError('Invalid confirmation reason.', 400));
  }
  if (new Date() > new Date(vCode.expireAt)) {
    return next(new AppError('Confirmation code has expired.', 400));
  }
  user.email = newEmail;
  (user as any).newEmail = undefined;
  user.verificationCode = { code: null, expireAt: null, reason: null };
  await user.save();
  return res.status(200).json({ message: 'Email has been updated successfully.' });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }
  if (!process.env.JWT_SECRET) {
    return next(new AppError('JWT_SECRET is not defined in environment variables', 500));
  }
  let payload: any;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
  const user = await Users.findById(payload.userId);
  if (!user || !user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
    return next(new AppError('Refresh token not recognized', 401));
  }
  // Issue new access token
  const newAccessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  res.status(200).json({ accessToken: newAccessToken });
});


