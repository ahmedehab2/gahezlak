import axios, { AxiosError } from "axios";
import { UnprocessableError } from "../errors/unprocessable-error";
import { IPlan } from "../models/plan";
import { IUser } from "../models/User";
import { IOrder } from "../models/Order";
import { IMenuItem } from "../models/MenuItem";
import { logger } from "../config/pino";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_MOTO_INTEGRATION_ID = +process.env.PAYMOB_MOTO_INTEGRATION_ID!;
const PAYMOB_DEFAULT_INTEGRATION_ID =
  +process.env.PAYMOB_DEFAULT_INTEGRATION_ID!;
const PAYMOB_WALLET_INTEGRATION_ID = +process.env.PAYMOB_WALLET_INTEGRATION_ID!;
const PAYMOB_CASH_INTEGRATION_ID = +process.env.PAYMOB_CASH_INTEGRATION_ID!;
const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY;
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY;
const SUBSCRIPTION_WEBHOOK_URL = process.env.SUBSCRIPTION_WEBHOOK_URL;
const ORDER_WEBHOOK_URL = process.env.ORDER_WEBHOOK_URL;
const PAYMOB_BASE_URL = "https://accept.paymob.com";

const frequencyMap = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

interface ICreatePlan {
  planName: string;
  frequency: string;
  planType?: string;
  amountInCents: number;
  startWithTrial: boolean;
  isActive: boolean;
}

export async function paymobLogin() {
  try {
    const authRes = await axios.post(`${PAYMOB_BASE_URL}/api/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });
    const token = authRes.data.token;
    return token;
  } catch (error) {
    throw new UnprocessableError({
      ar: "خطأ في تسجيل الدخول إلى paymob",
      en: "Error in login to paymob",
    });
  }
}

export async function createSubscriptionPlan({
  planName,
  frequency,
  planType = "rent",
  amountInCents,
  startWithTrial,
  isActive,
}: ICreatePlan) {
  try {
    const token = await paymobLogin();

    const plan = await axios.post(
      `${PAYMOB_BASE_URL}/api/acceptance/subscription-plans`,
      {
        name: planName,
        frequency: frequencyMap[frequency as keyof typeof frequencyMap],
        plan_type: planType,
        amount_cents: amountInCents,
        use_transaction_amount: !startWithTrial,
        is_active: isActive,
        integration: PAYMOB_MOTO_INTEGRATION_ID,
        webhook_url: SUBSCRIPTION_WEBHOOK_URL,
        retrial_days: 3,
        reminder_days: 3,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return plan.data;
  } catch (error) {
    throw new UnprocessableError({
      ar: "خطأ في إنشاء خطة اشتراك paymob",
      en: "Error in create subscription plan to paymob",
    });
  }
}

export async function createSubscriptionIntent({
  plan,
  user,
  trialDays,
  extras,
}: {
  plan: IPlan;
  user: IUser;
  trialDays: number;
  extras?: any;
}) {
  try {
    const startDate = new Date(Date.now() + trialDays * 86400000)
      .toISOString()
      .split("T")[0]; // format: YYYY-MM-DD
    const sub = await axios.post(
      `${PAYMOB_BASE_URL}/v1/intention/`,
      {
        currency: plan.currency,
        amount: plan.price * 100, //cents
        subscription_plan_id: plan.paymobPlanId,
        payment_methods: [PAYMOB_DEFAULT_INTEGRATION_ID],
        items: [
          {
            name: plan.title,
            description: plan.description,
            amount: plan.price * 100, //cents
            quantity: 1,
          },
        ],
        billing_data: {
          email: user.email,
          phone_number: user.phoneNumber,
          first_name: user.firstName,
          last_name: user.lastName,
        },

        customer: {
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          extras: {
            userId: user._id.toString(),
          },
        },

        ...(trialDays > 0 && { subscription_start_date: startDate }),
        // special_reference: PAYMOB_MERCHANT_ID,
        extras,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYMOB_SECRET_KEY}`,
        },
      }
    );

    const iframeUrl = ` https://accept.paymob.com/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${sub.data.client_secret}`;

    return {
      iframeUrl,
      paymobSubscription: sub.data,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error(error.response?.data.message);
    }
    throw new UnprocessableError({
      ar: "خطأ في إنشاء صفحة الاشتراك في paymob",
      en: "Error in creating subscription intent to paymob",
    });
  }
}

export async function createPaymentIntent({
  order,
  customer,
  shopName,
}: {
  order: IOrder;
  shopName: string;
  customer: {
    first_name: string;
    last_name: string;
    phone_number: string;
  };
}) {
  try {
    const paymentIntent = await axios.post(
      `${PAYMOB_BASE_URL}/v1/intention`,
      {
        currency: "EGP",
        amount: order.totalAmount * 100, //cents
        payment_methods: [
          PAYMOB_DEFAULT_INTEGRATION_ID,
          PAYMOB_CASH_INTEGRATION_ID,
          PAYMOB_WALLET_INTEGRATION_ID,
        ],
        items: order.orderItems.map((item) => ({
          name:
            (item.menuItem as IMenuItem).name.en ||
            (item.menuItem as IMenuItem).name.ar,
          description:
            (item.menuItem as IMenuItem).description?.en ||
            (item.menuItem as IMenuItem).description?.ar,
          amount: item.price * 100, //cents
          quantity: item.quantity,
        })),
        billing_data: {
          phone_number: customer.phone_number,
          first_name: customer.first_name,
          last_name: customer.last_name,
        },
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone_number: customer.phone_number,
        },
        special_reference: order._id.toString(),
        extras: {
          orderId: order._id.toString(),
        },
        notification_url: ORDER_WEBHOOK_URL,
        redirection_url: `${process.env.FRONTEND_URL}/shops/${shopName}/orders/checkout/${order.orderNumber}`,
      },
      {
        headers: {
          Authorization: `Token ${PAYMOB_SECRET_KEY}`,
        },
      }
    );

    const iframeUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${paymentIntent.data.client_secret}`;

    return {
      iframeUrl,
      paymobPayment: paymentIntent.data,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      const msg = error.response?.data.message || "Unknown error";
      logger.error(msg);
    }
    throw new UnprocessableError({
      ar: "خطأ في إنشاء صفحة الدفع في paymob",
      en: "Error in creating payment intent to paymob",
    });
  }
}
//cancle subscription

export async function cancelPaymobSubscription(paymobSubscriptionId: number) {
  try {
    const token = await paymobLogin();
    const cancelSubscription = await axios.post(
      `${PAYMOB_BASE_URL}/api/acceptance/subscriptions/${paymobSubscriptionId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return cancelSubscription.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const msg = error.response?.data?.message || "Unknown error";
      logger.error(msg);
    }
    throw new UnprocessableError({
      ar: "خطأ في إلغاء الاشتراك في paymob",
      en: "Error in canceling paymob subscription",
    });
  }
}

export async function refundOrder(transactionId: string) {
  try {
    const refundOrder = await axios.post(
      `${PAYMOB_BASE_URL}/api/acceptance/void_refund/void`,
      {
        transaction_id: transactionId,
      },
      {
        headers: {
          Authorization: `Token ${PAYMOB_SECRET_KEY}`,
        },
      }
    );
    return refundOrder.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const msg = error.response?.data?.message || "Unknown error";
      logger.error(msg);
    }
    throw new UnprocessableError({
      ar: "خطأ في رد الطلب في paymob",
      en: "Error in refunding order in paymob",
    });
  }
}
