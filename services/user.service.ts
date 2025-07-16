import { Users } from "../models/User";
import { sendEmail } from "../utils/sendEmail";
import otpGenerator from "otp-generator";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";

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

  return {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    },
    message: "Email has been updated successfully.",
  };
}

// Helper function to get user by ID (for other services)
export async function getUserById(userId: string) {
  const user = await Users.findById(userId);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }
  return user;
}

// Get user profile with populated shop data
export async function getUserProfile(userId: string) {
  const user = await Users.findById(userId)
    .populate({
      path: "shop",
      select:
        "name description address phone email qrCodeImage subscriptionId createdAt updatedAt",
      populate: {
        path: "subscriptionId",
        select: "status currentPeriodStart currentPeriodEnd plan",
        populate: {
          path: "plan",
          select:
            "planGroup title description price currency frequency features isActive",
        },
      },
    })
    .populate("role", "name")
    .select("-password -refreshToken -verificationCode -newEmail");

  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  return user;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updateData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }
) {
  const user = await Users.findById(userId);
  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  // Update only allowed fields
  if (updateData.firstName) user.firstName = updateData.firstName;
  if (updateData.lastName) user.lastName = updateData.lastName;
  if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;

  await user.save();

  return {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    },
    message: "Profile updated successfully.",
  };
}

// Get all users (admin only)
export async function getAllUsers(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  const skip = (page - 1) * limit;

  let query: any = {};

  // Add search functionality
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
    ];
  }

  const users = await Users.find(query)
    .populate("role", "name")
    .populate(
      "shop",
      "name description address phoneNumber email ownerId subscriptionId"
    )
    .select("-password -refreshToken -verificationCode")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Users.countDocuments(query);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// Get user by ID (admin only)
export async function getUserByIdAdmin(userId: string) {
  const user = await Users.findById(userId)
    .populate("role", "name")
    .populate(
      "shop",
      "name description address phoneNumber email ownerId subscriptionId"
    )
    .select("-password -refreshToken -verificationCode");

  if (!user) {
    throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
  }

  return user;
}
