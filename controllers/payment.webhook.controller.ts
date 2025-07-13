// import { Request, Response, NextFunction, RequestHandler } from "express";
// import crypto from "crypto";
// import { Errors } from "../errors";
// import { errMsg } from "../common/err-messages";
// // import { processSuccessfulSubscriptionPayment } from "../services/payment.service";
// import { logger } from "../config/pino";
// import { Subscriptions, SubscriptionStatus } from "../models/Subscription";

// const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!;

// function verifyPaymobSubscriptionHmac(payload: any): boolean {
//   if (
//     !payload.subscription_data?.id ||
//     !payload.trigger_type ||
//     !payload.hmac
//   ) {
//     return false;
//   }
//   const { id } = payload.subscription_data;

//   const concatenatedString = `${payload.trigger_type}for${id}`;

//   const calculatedHmac = crypto
//     .createHmac("sha512", PAYMOB_HMAC_SECRET!)
//     .update(concatenatedString)
//     .digest("hex");

//   return crypto.timingSafeEqual(
//     Buffer.from(calculatedHmac),
//     Buffer.from(payload.hmac)
//   );
// }

// export const handlePaymobSubscriptionWebhook: RequestHandler = async (
//   req,
//   res
// ) => {
//   try {
//     const webhookData = req.body;

//     if (!verifyPaymobSubscriptionHmac(webhookData)) {
//       console.error("Invalid HMAC signature");
//       res.status(401).json({ error: "Invalid signature" });
//       return;
//     }

//     console.log("Webhook received:", webhookData.trigger_type);

//     switch (webhookData.trigger_type) {
//       case "Subscription Created":
//         await handleSubscriptionCreated(webhookData);
//         break;
//       case "Subscription Activated":
//         await handleSubscriptionActivated(webhookData);
//         break;
//       case "Subscription Cancelled":
//         await handleSubscriptionCancelled(webhookData);
//         break;
//       case "Subscription Expired":
//         await handleSubscriptionExpired(webhookData);
//         break;
//       case "Subscription Renewed":
//         await handleSubscriptionRenewed(webhookData);
//         break;
//       default:
//         console.log("Unhandled webhook type:", webhookData.trigger_type);
//     }

//     res.status(200).json({ received: true });
//   } catch (error) {
//     console.error("Webhook processing error:", error);
//     res.status(500).json({ error: "Webhook processing failed" });
//   }
// };

// async function handleSubscriptionCreated(data: any) {
//   const { subscription_data } = data;

//   try {
//     // Find subscription by user email or phone (since we don't have direct reference)
//     // You might need to adjust this based on how you store the reference
//     const subscription = await Subscriptions.findOne({
//       _id: subscription_data.extras.subscriptionId,
//     });
//     console.log(
//       "subscription_data.extras.subscriptionId",
//       subscription_data.extras.subscriptionId
//     );
//     console.log("subscription", subscription);

//     if (subscription) {
//       await Subscriptions.findByIdAndUpdate(subscription._id, {
//         paymobSubscriptionId: subscription_data.id.toString(),
//         status:
//           subscription_data.state === "active"
//             ? SubscriptionStatus.ACTIVE
//             : SubscriptionStatus.TRIALING,
//         currentPeriodStart: new Date(subscription_data.starts_at),
//         currentPeriodEnd: new Date(subscription_data.next_billing),
//       });

//       console.log(`Subscription created: ${subscription._id}`);
//     } else {
//       console.error("Could not find matching subscription for webhook");
//     }
//   } catch (error) {
//     console.error("Error handling subscription created:", error);
//   }
// }

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

//disabled paymob integration for now
