import axios, { AxiosError } from "axios";
import { UnprocessableError } from "../errors/unprocessable-error";
import { IPlan } from "../models/plan";
import { IUser } from "../models/User";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_MOTO_INTEGRATION_ID = +process.env.PAYMOB_MOTO_INTEGRATION_ID!;
const PAYMOB_DEFAULT_INTEGRATION_ID =
  +process.env.PAYMOB_DEFAULT_INTEGRATION_ID!;
const PAYMOB_WALLET_INTEGRATION_ID = +process.env.PAYMOB_WALLET_INTEGRATION_ID!;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY;
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY;
const PAYMOB_MERCHANT_ID = process.env.PAYMOB_MERCHANT_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

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
        webhook_url: WEBHOOK_URL,
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
      console.log(error.response?.data);
    }
    throw new UnprocessableError({
      ar: "خطأ في إنشاء صفحة الاشتراك في paymob",
      en: "Error in creating subscription intent to paymob",
    });
  }
}

//cancle subscription

export async function cancelSubscription(subscriptionId: string) {
  const token = await paymobLogin();

  const cancelSubscription = await axios.post(
    `${PAYMOB_BASE_URL}/api/acceptance/subscriptions/${subscriptionId}/cancel`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return cancelSubscription.data;
}
