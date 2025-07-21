import { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "crypto";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
// import { processSuccessfulSubscriptionPayment } from "../services/payment.service";
import { logger } from "../config/pino";
import { Subscriptions, SubscriptionStatus } from "../models/Subscription";
import { Shops } from "../models/Shop";
import { Plans } from "../models/plan";
import { Users } from "../models/User";
import { PaymobWebhookPayload } from "../common/types/general-types";

const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!;

function verifyPaymobSubscriptionHmac(payload: any): boolean {
  if (
    !payload.subscription_data?.id ||
    !payload.trigger_type ||
    !payload.hmac
  ) {
    return false;
  }
  const { id } = payload.subscription_data;

  const concatenatedString = `${payload.trigger_type}for${id}`;

  const calculatedHmac = crypto
    .createHmac("sha512", PAYMOB_HMAC_SECRET!)
    .update(concatenatedString)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac),
    Buffer.from(payload.hmac)
  );
}

export const handlePaymobSubscriptionWebhook: RequestHandler = async (
  req,
  res
) => {
  try {
    const webhookData = req.body;

    const isValid = verifyPaymobSubscriptionHmac(webhookData);
    console.log("isValid", isValid);
    if (!isValid) {
      throw new Errors.BadRequestError(errMsg.INVALID_HMAC_SIGNATURE);
    }

    switch (webhookData.trigger_type) {
      case "Subscription Created":
        await handleSubscriptionCreated(webhookData);
        break;
      //   case "Subscription Activated":
      //     await handleSubscriptionActivated(webhookData);
      //     break;
      //   case "Subscription Cancelled":
      //     await handleSubscriptionCancelled(webhookData);
      //     break;
      //   case "Subscription Expired":
      //     await handleSubscriptionExpired(webhookData);
      //     break;
      //   case "Subscription Renewed":
      //     await handleSubscriptionRenewed(webhookData);
      //     break;
      default:
        logger.warn(`Unhandled webhook type: ${webhookData.trigger_type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

async function handleSubscriptionCreated(data: PaymobWebhookPayload) {
  const { subscription_data, transaction_id } = data;

  try {
    // Find user by email
    const user = await Users.findOne({
      email: subscription_data.client_info.email,
    });

    if (!user) {
      throw new Errors.NotFoundError(errMsg.USER_NOT_FOUND);
    }

    // Find plan by name
    const plan = await Plans.findOne({
      title: subscription_data.name,
    });

    if (!plan) {
      throw new Errors.NotFoundError(errMsg.PLAN_NOT_FOUND);
    }

    // Create subscription with trial
    const subscription = await Subscriptions.create({
      userId: user._id,
      shop: user.shop,
      plan: plan._id,
      status: SubscriptionStatus.TRIALING, // Start with TRIALING status
      paymobSubscriptionId: subscription_data.id,
      paymobTransactionId: transaction_id,
      currentPeriodStart: new Date(), // Trial starts now
      currentPeriodEnd: new Date(subscription_data.next_billing), // Trial ends when subscription starts
    });

    await Shops.findByIdAndUpdate(user.shop, {
      subscriptionId: subscription._id,
    });

    logger.info(`Subscription created: ${subscription._id}`);
  } catch (error) {
    logger.error("Error creating subscription:", error);
  }
}

// async function handleSubscriptionActivated(data: any) {
//   const { subscription_data } = data;

//   try {
//     await Subscriptions.findOneAndUpdate(
//       { paymobSubscriptionId: subscription_data.id.toString() },
//       {
//         status: SubscriptionStatus.ACTIVE,
//         currentPeriodStart: new Date(subscription_data.starts_at),
//         currentPeriodEnd: new Date(subscription_data.next_billing),
//       }
//     );

//     console.log(`Subscription activated: ${subscription_data.id}`);
//   } catch (error) {
//     console.error("Error handling subscription activated:", error);
//   }
// }

// async function handleSubscriptionCancelled(data: any) {
//   const { subscription_data } = data;

//   try {
//     await Subscriptions.findOneAndUpdate(
//       { paymobSubscriptionId: subscription_data.id.toString() },
//       {
//         status: SubscriptionStatus.CANCELLED,
//         cancelledAt: new Date(),
//         // Keep currentPeriodEnd as is - they can use service until period ends
//       }
//     );

//     console.log(`Subscription cancelled: ${subscription_data.id}`);
//   } catch (error) {
//     console.error("Error handling subscription cancelled:", error);
//   }
// }

// async function handleSubscriptionExpired(data: any) {
//   const { subscription_data } = data;

//   try {
//     await Subscriptions.findOneAndUpdate(
//       { paymobSubscriptionId: subscription_data.id.toString() },
//       {
//         status: SubscriptionStatus.EXPIRED,
//         currentPeriodEnd: new Date(), // Set to now since it's expired
//       }
//     );

//     console.log(`Subscription expired: ${subscription_data.id}`);
//   } catch (error) {
//     console.error("Error handling subscription expired:", error);
//   }
// }

// async function handleSubscriptionRenewed(data: any) {
//   const { subscription_data } = data;

//   try {
//     await Subscriptions.findOneAndUpdate(
//       { paymobSubscriptionId: subscription_data.id.toString() },
//       {
//         status: SubscriptionStatus.ACTIVE,
//         currentPeriodStart: new Date(),
//         currentPeriodEnd: new Date(subscription_data.next_billing),
//       }
//     );

//     console.log(`Subscription renewed: ${subscription_data.id}`);
//   } catch (error) {
//     console.error("Error handling subscription renewed:", error);
//   }
// }
