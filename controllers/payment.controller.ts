import { RequestHandler } from "express";
import * as paymentService from "../services/payment.service";
import { IPayment, PaymentMethods, PaymentStatus } from "../models/Payment";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { SuccessResponse } from "../common/types/contoller-response.types";
import * as planService from "../services/plan.service";
import * as subscriptionService from "../services/subscription.service";
import * as userService from "../services/user.service";
import { updateShop } from "../services/shop.service";
import mongoose, { Mongoose, ObjectId } from "mongoose";

// Helper function to mock payment processing
function mockPay(paymentMethod: string): Promise<PaymentStatus> {
  // Simulate payment gateway response
  return new Promise((resolve) => {
    setTimeout(() => {
      // Always succeed for mock
      resolve(PaymentStatus.COMPLETED);
    }, 500);
  });
}

// Create payment for subscription plan
export const payForPlanHandler: RequestHandler<
  unknown,
  SuccessResponse<{
    paymentId: string;
    status: PaymentStatus;
  }>,
  {
    planId: string;
    paymentMethod: PaymentMethods;
    paymentMethodDetails: any;
  }
> = async (req, res) => {
  const { planId, paymentMethod, paymentMethodDetails } = req.body;
  const userId = new mongoose.Types.ObjectId(req.user?.userId);

  const plan = await planService.getPlanById(planId);
  if (!plan) {
    throw new Errors.NotFoundError(errMsg.PLAN_NOT_FOUND);
  }
  const user = await userService.getUserById(userId.toString());

  if (!user.shopId) {
    throw new Errors.BadRequestError({
      en: "User does not have a shopId",
      ar: "المستخدم ليس لديه معرف متجر",
    });
  }

  const mockedPayment = await mockPay(paymentMethod);

  if (mockedPayment !== PaymentStatus.COMPLETED) {
    throw new Errors.BadRequestError({
      en: "Payment failed",
      ar: "فشل الدفع",
    });
  }

  const payment = await paymentService.createPaymentForPlan({
    userId,
    planId: plan._id,
    amount: plan.price,
    paymentMethod: paymentMethod,
  });

  const subscription = await subscriptionService.createSubscription({
    userId,
    shop: user.shopId,
    plan,
  });
  await updateShop(user.shopId.toString(), {
    subscriptionId: subscription.id,
  });

  res.status(201).json({
    message: "Payment created successfully",
    data: { paymentId: payment._id.toString(), status: mockedPayment },
  });
};

// Create payment for order guest
export const payForOrderHandler: RequestHandler<
  unknown,
  SuccessResponse<{
    paymentId: string;
    status: PaymentStatus;
  }>,
  {
    orderId: string;
    paymentMethod: PaymentMethods;
    paymentMethodDetails: any;
  }
> = async (req, res) => {
  const { orderId, paymentMethod, paymentMethodDetails } = req.body;
};
