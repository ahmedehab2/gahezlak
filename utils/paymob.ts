import axios from 'axios';

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;

const BASE_URL = 'https://accept.paymob.com/api';

export async function getPaymobToken() {
  try {
    console.log('Making Paymob auth request with API key:', PAYMOB_API_KEY ? 'SET' : 'NOT SET');
    const { data } = await axios.post(`${BASE_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });
    console.log('Paymob auth response:', data);
    return data.token;
  } catch (error: any) {
    console.error('Paymob auth error:', error.response?.data || error.message);
    throw error;
  }
}

export async function createPaymobOrder(token: string, amountCents: number, items: any[] = []) {
  try {
    console.log('Creating Paymob order with token:', token, 'amount:', amountCents);
    const { data } = await axios.post(`${BASE_URL}/ecommerce/orders`, {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      items,
    });
    console.log('Paymob order response:', data);
    return data;
  } catch (error: any) {
    console.error('Paymob order creation error:', error.response?.data || error.message);
    throw error;
  }
}

export async function getPaymobPaymentKey(token: string, orderId: number, amountCents: number, billingData: any) {
  try {
    console.log('Getting payment key with orderId:', orderId, 'billingData:', billingData);
    const { data } = await axios.post(`${BASE_URL}/acceptance/payment_keys`, {
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency: 'EGP',
      integration_id: PAYMOB_INTEGRATION_ID,
    });
    console.log('Paymob payment key response:', data);
    return data.token;
  } catch (error: any) {
    console.error('Paymob payment key error:', error.response?.data || error.message);
    throw error;
  }
}

export function getPaymobIframeUrl(paymentKey: string) {
  return `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
} 