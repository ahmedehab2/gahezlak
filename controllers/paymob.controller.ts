// import { Request, Response, NextFunction } from "express";
// import { Errors } from "../errors";
// import { errMsg } from "../common/err-messages";
// import { initiateSubscriptionPayment } from "../services/payment.service";
// import { Plans } from "../models/plan";
// import { Shops } from "../models/Shop";
// import { Subscriptions, status } from "../models/Subscription";

// // Initiate a Paymob order for subscription
// export async function initiatePaymobOrder(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   try {
//     const { planId, shopId, billingData } = req.body;
//     const userId = req.user?._id;

//     // Validate required fields
//     if (!planId || !shopId || !billingData) {
//       throw new Errors.BadRequestError({
//         en: "Missing required fields: planId, shopId, or billing data",
//         ar: "حقول مطلوبة مفقودة: معرف الخطة، معرف المتجر، أو بيانات الفواتير",
//       });
//     }

//     // Check if plan exists
//     const plan = await Plans.findById(planId);
//     if (!plan) {
//       throw new Errors.NotFoundError({
//         en: "Subscription plan not found",
//         ar: "خطة الاشتراك غير موجودة",
//       });
//     }

//     // Check if shop exists and belongs to user
//     const shop = await Shops.findOne({ _id: shopId, userId });
//     if (!shop) {
//       throw new Errors.NotFoundError({
//         en: "Shop not found or does not belong to user",
//         ar: "المتجر غير موجود أو لا ينتمي للمستخدم",
//       });
//     }

//     // Check if subscription exists
//     const subscription = await Subscriptions.findOne({ shop: shopId, userId });
//     if (!subscription) {
//       throw new Errors.NotFoundError({
//         en: "Subscription not found for this shop",
//         ar: "الاشتراك غير موجود لهذا المتجر",
//       });
//     }

//     // Get price based on user's country (default to first price if not found)
//     const userCountry = billingData.country || "EG"; // Default to Egypt if not provided
//     const priceInfo =
//       plan.prices.find((p) => p.country === userCountry) || plan.prices[0];

//     if (!priceInfo) {
//       throw new Errors.BadRequestError({
//         en: "No pricing available for this plan",
//         ar: "لا يوجد تسعير متاح لهذه الخطة",
//       });
//     }

//     // Use monthly price by default
//     const amount = priceInfo.monthlyPrice;

//     // Initiate payment
//     const paymentData = await initiateSubscriptionPayment(
//       userId.toString(),
//       planId,
//       shopId,
//       amount,
//       billingData
//     );

//     res.status(200).json({
//       success: true,
//       data: {
//         paymentId: paymentData.payment._id,
//         iframeUrl: paymentData.iframeUrl,
//         amount,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// }

//disabled paymob integration for now
