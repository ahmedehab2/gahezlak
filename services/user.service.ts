import bcryptjs from 'bcryptjs';
import { Users } from '../models/User';
import { sendEmail } from '../utils/sendEmail';
import { AppError } from '../utils/classError';
import otpGenerator from 'otp-generator';
import jwt from 'jsonwebtoken';
import { Roles } from '../models/Role';
import { Subscriptions } from '../models/Subscription';
import { Plans } from '../models/Plan';

const { hash } = bcryptjs;

export class UserService {
  static async signUp(userData: {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    role?: string;
  }) {
    const { name, email, password, phoneNumber, role } = userData;

    const userExist = await Users.findOne({ email: email.toLowerCase() });
    if (userExist) {
      throw new AppError("This email is already registered!, please use another email!", 409);
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
      throw new AppError("Failed to send email", 409);
    }

    const hashedPassword = await hash(password, parseInt(process.env.saltRounds || '7'));

    let roleId;
    if (role) {
      // If role is provided, find its ObjectId
      const foundRole = await Roles.findOne({ role: role });
      if (!foundRole) {
        throw new AppError('Invalid role provided', 400);
      }
      roleId = foundRole._id;
    } else {
      // Default to 'customer' role
      const customerRole = await Roles.findOne({ role: 'customer' });
      if (!customerRole) {
        throw new AppError('Default customer role not found in database', 500);
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
    return { message: "Congrats! You're registered. Please check your email for the verification code.", user: createdUser };
  }

  static async verifyCode(verificationData: { email: string; code: string; reason: string }) {
    const { email, code, reason } = verificationData;
    const user = await Users.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const vCode = user.verificationCode;
    if (!vCode.code || !vCode.expireAt || !vCode.reason) {
      throw new AppError('No verification code found. Please request a new code.', 400);
    }
    if (vCode.code !== code) {
      throw new AppError('Invalid verification code.', 400);
    }
    if (vCode.reason !== reason) {
      throw new AppError('Invalid verification reason.', 400);
    }
    if (new Date() > new Date(vCode.expireAt)) {
      throw new AppError('Verification code has expired.', 400);
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

    // Create trial subscription if not exists
    const existingSub = await Subscriptions.findOne({ userId: user._id });
    if (!existingSub) {
      // Find the Starter plan
      const starterPlan = await Plans.findOne({ name: 'Starter', isActive: true });
      if (!starterPlan) {
        throw new AppError('Starter plan not found', 500);
      }
      const trialEndsAt = new Date(Date.now() + starterPlan.duration * 24 * 60 * 60 * 1000);
      await Subscriptions.create({
        userId: user._id,
        plan: starterPlan._id,
        status: 'active',
        trialEndsAt,
      });
    }

    return { message: 'Verification successful. Your account is now verified.' };
  }

  static async resendVerificationCode(resendData: { email: string; reason: string }) {
    const { email, reason } = resendData;
    const user = await Users.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (user.isVerified) {
      throw new AppError('User is already verified.', 400);
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
      throw new AppError("Failed to send email", 409);
    }
    
    return { message: 'A new verification code has been sent to your email.' };
  }

  static async login(loginData: { email: string; password: string }) {
    const { email, password } = loginData;
    const user = await Users.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    if (!user.isVerified) {
      throw new AppError('Account is not verified. Please verify your account first.', 403);
    }
    
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }
    
    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT_SECRET is not defined in environment variables', 500);
    }
    
    // Generate access token (short-lived)
    const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Store refresh token in user document
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save();
    
    return { message: 'Login successful', accessToken, refreshToken };
  }

  static async forgotPassword(emailData: { email: string }) {
    const { email } = emailData;
    const user = await Users.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('User not found', 404);
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
      throw new AppError("Failed to send email", 409);
    }
    
    return { message: 'A password reset code has been sent to your email.' };
  }

  static async resetPassword(resetData: { email: string; code: string; newPassword: string }) {
    const { email, code, newPassword } = resetData;
    const user = await Users.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const vCode = user.verificationCode;
    if (!vCode.code || !vCode.expireAt || !vCode.reason) {
      throw new AppError('No verification code found. Please request a new code.', 400);
    }
    if (vCode.code !== code) {
      throw new AppError('Invalid verification code.', 400);
    }
    if (vCode.reason !== 'password_reset') {
      throw new AppError('Invalid verification reason.', 400);
    }
    if (new Date() > new Date(vCode.expireAt)) {
      throw new AppError('Verification code has expired.', 400);
    }
    
    const hashedPassword = await bcryptjs.hash(newPassword, parseInt(process.env.saltRounds || '7'));
    user.password = hashedPassword;
    user.verificationCode = { code: null, expireAt: null, reason: null };
    await user.save();
    
    return { message: 'Password has been reset successfully.' };
  }

  static async requestEmailChange(userId: string, newEmail: string) {
    const user = await Users.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const emailExists = await Users.findOne({ email: newEmail.toLowerCase() });
    if (emailExists) {
      throw new AppError('This email is already in use.', 409);
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
      throw new AppError('Failed to send email', 409);
    }
    
    return { message: 'A confirmation code has been sent to your new email.' };
  }

  static async confirmEmailChange(userId: string, code: string) {
    const user = await Users.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const vCode = user.verificationCode;
    const newEmail = (user as any).newEmail;
    if (!vCode.code || !vCode.expireAt || !vCode.reason || !newEmail) {
      throw new AppError('No email change request found.', 400);
    }
    if (vCode.code !== code) {
      throw new AppError('Invalid confirmation code.', 400);
    }
    if (vCode.reason !== 'email_change') {
      throw new AppError('Invalid confirmation reason.', 400);
    }
    if (new Date() > new Date(vCode.expireAt)) {
      throw new AppError('Confirmation code has expired.', 400);
    }
    
    user.email = newEmail;
    (user as any).newEmail = undefined;
    user.verificationCode = { code: null, expireAt: null, reason: null };
    await user.save();
    
    return { message: 'Email has been updated successfully.' };
  }

  static async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }
    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT_SECRET is not defined in environment variables', 500);
    }
    
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    
    const user = await Users.findById(payload.userId);
    if (!user || !user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
      throw new AppError('Refresh token not recognized', 401);
    }
    
    // Issue new access token
    const newAccessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return { accessToken: newAccessToken };
  }
} 