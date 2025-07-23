import { Request, Response, NextFunction, RequestHandler } from "express";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";

import { logger } from "../config/pino";
import { Subscriptions, SubscriptionStatus } from "../models/Subscription";
import { Shops } from "../models/Shop";
import { Plans } from "../models/plan";
import { Users } from "../models/User";
import { PaymobWebhookPayload } from "../common/types/general-types";
import {
  verifyPaymobSubscriptionHmac,
  verifyPaymobCallbackHMAC,
} from "../utils/paymob-hmac-verification";
import { Orders, OrderStatus } from "../models/Order";

export const handlePaymobSubscriptionWebhook: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const webhookData = req.body;

    const isValidSuscriptionHmac = verifyPaymobSubscriptionHmac(webhookData);

    const isValidCallbackHMAC = verifyPaymobCallbackHMAC(
      webhookData.obj,
      (req.query.hmac as string) || ""
    );

    if (!isValidSuscriptionHmac && !isValidCallbackHMAC) {
      throw new Errors.BadRequestError(errMsg.INVALID_HMAC_SIGNATURE);
    }
    logger.info(
      "Paymob Subscription Webhook received",
      webhookData.trigger_type
    );

    if (webhookData.type === "TRANSACTION") {
      await handleTransactionProcessed(webhookData.obj);
    } else if (webhookData.trigger_type) {
      const trigger = webhookData.trigger_type.toLowerCase();

      if (trigger.includes("created")) {
        await handleSubscriptionCreated(webhookData);
      } else if (trigger.includes("canceled")) {
        await handleSubscriptionCancelled(webhookData);
      } else if (trigger.includes("successful transaction")) {
        await handleSubscriptionRenewed(webhookData);
      } else {
        logger.warn(`Unhandled webhook type: ${webhookData.trigger_type}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

async function handleTransactionProcessed(data: any) {
  if (!data.success || !data.payment_key_claims.subscription_plan_id) {
    return;
  }

  const { shopId, planId } = data.payment_key_claims.extra;

  if (!shopId || !planId) {
    logger.error(
      "Webhook (Transaction): Critical - Missing shopId or planId in extras.",
      data.payment_key_claims.extra
    );
    return;
  }

  // Find the PENDING subscription you created before payment
  const subscription = await Subscriptions.findOne({
    shop: shopId,
    status: SubscriptionStatus.PENDING,
  });
  const plan = await Plans.findById(planId);

  if (!subscription || !plan) {
    logger.error(
      `Webhook (Transaction): Pending subscription or Plan not found for shop ${shopId}.`
    );
    return;
  }

  // ACTIVATE the subscription
  subscription.status =
    plan.trialPeriodDays > 0
      ? SubscriptionStatus.TRIALING
      : SubscriptionStatus.ACTIVE;
  subscription.paymobTransactionId = data.id; // The ID of this specific payment

  // The start date of the trial/subscription is 'now' or the date from Paymob
  subscription.currentPeriodStart = new Date();
  if (
    plan.trialPeriodDays > 0 &&
    data.payment_key_claims.subscription_start_date
  ) {
    subscription.currentPeriodEnd = new Date(
      data.payment_key_claims.subscription_start_date
    );
  } else {
    // If no trial, calculate the end date based on plan frequency
    const endDate = new Date(subscription.currentPeriodStart);
    if (plan.frequency === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    subscription.currentPeriodEnd = endDate;
  }

  subscription.isTrialUsed = plan.trialPeriodDays > 0;

  await subscription.save();
  logger.info(
    `Subscription for shop ${shopId} ACTIVATED via Transaction ID ${data.id}.`
  );
}

async function handleSubscriptionCreated(payload: any) {
  const { subscription_data, transaction_id } = payload;

  const subscription = await Subscriptions.findOne({
    paymobTransactionId: transaction_id,
  });

  if (!subscription) {
    logger.warn(
      `Webhook (Subscription Created): Could not find an activated subscription for transaction_id ${transaction_id}. It might be processed with a slight delay.`
    );
    return;
  }

  if (subscription.paymobSubscriptionId) {
    return;
  }

  subscription.paymobSubscriptionId = subscription_data.id;
  await subscription.save();
  await Shops.findByIdAndUpdate(subscription.shop, {
    $set: {
      subscriptionId: subscription._id,
    },
  });

  logger.info(
    `Paymob Subscription ID ${subscription_data.id} saved for local subscription ${subscription._id}.`
  );
  logger.info(
    `Shop ${subscription.shop} subscription updated with Paymob Subscription ID ${subscription_data.id}.`
  );
}

async function handleSubscriptionCancelled(data: any) {
  const { subscription_data } = data;

  const subscription = await Subscriptions.findOneAndUpdate(
    { paymobSubscriptionId: subscription_data.id },
    {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
      // Keep currentPeriodEnd as is - they can use service until period ends
    }
  );

  logger.info(
    `Subscription cancelled: ${subscription?.id} for Paymob Subscription ID ${subscription_data.id} for shop ${subscription?.shop}`
  );
}

async function handleSubscriptionRenewed(data: any) {
  const { subscription_data, transaction_id } = data;

  if (!subscription_data.id) {
    logger.error(
      "Webhook (Renewal): Missing subscription_id in transaction data."
    );
    return;
  }

  // Find the active subscription using the ID from Paymob
  const subscription = await Subscriptions.findOne({
    paymobSubscriptionId: subscription_data.id,
  });

  if (!subscription) {
    logger.warn(
      `Webhook (Renewal): Could not find subscription with Paymob ID ${subscription_data.id}.`
    );
    return;
  }

  const plan = await Plans.findById(subscription.plan);
  if (!plan) {
    logger.error(
      `Webhook (Renewal): Could not find plan ${subscription.plan} for subscription ${subscription._id}.`
    );

    return;
  }

  const newPeriodStart = new Date(data.created_at);
  const newPeriodEnd = new Date(newPeriodStart);

  if (plan.frequency === "monthly") {
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
  } else if (plan.frequency === "yearly") {
    newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
  } else {
    logger.error(
      `Webhook (Renewal): Unknown plan frequency "${plan.frequency}".`
    );
    return;
  }

  subscription.status = SubscriptionStatus.ACTIVE;
  subscription.currentPeriodStart = newPeriodStart;
  subscription.currentPeriodEnd = newPeriodEnd;
  subscription.paymobTransactionId = transaction_id; // Update to the latest transaction ID

  await subscription.save();

  logger.info(
    `Subscription ${subscription._id} for shop ${
      subscription.shop
    } renewed successfully. New period: ${newPeriodStart.toISOString()} to ${newPeriodEnd.toISOString()}.`
  );
}

export const handlePaymobOrdersWebhook: RequestHandler = async (req, res) => {
  const { obj } = req.body;

  const isValid = verifyPaymobCallbackHMAC(obj, req.query.hmac as string);

  if (!isValid) {
    throw new Errors.BadRequestError(errMsg.INVALID_HMAC_SIGNATURE);
  }

  const transactionId = obj?.id;
  const orderId = obj?.payment_key_claims.extra.orderId;

  const isPaid = obj.success && !obj.pending;

  if (isPaid) {
    await handleOrderPaid(orderId, transactionId);
  }

  logger.info(`Order paid: ${orderId}`);
  res.status(200).json({ message: "Webhook processed" });
  return;
};

async function handleOrderPaid(orderId: string, transactionId: string) {
  return await Orders.findByIdAndUpdate(orderId, {
    orderStatus: OrderStatus.Confirmed,
    paymobTransactionId: transactionId,
  });
}
