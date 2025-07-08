import { Payments, PaymentMethod } from '../models/Payment';
import { Subscriptions } from '../models/Subscription';
import { Users } from '../models/User';
import { sendEmail } from '../utils/sendEmail';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';

export async function processPaymentSuccess(paymentData: {
  paymobOrderId: string;
  transactionId: string;
  paymentMethod: string;
  sourceDataType?: string;
  sourceDataSubType?: string;
}) {
  const { paymobOrderId, transactionId, paymentMethod, sourceDataType, sourceDataSubType } = paymentData;
  const payment = await Payments.findOne({ paymobOrderId });
  if (!payment) {
    throw new Errors.NotFoundError(errMsg.PAYMENT_NOT_FOUND)
  }
  payment.paymentStatus = 'Completed';
  payment.transactionId = transactionId;
  payment.paymentMethod = mapPaymentMethod(sourceDataType, sourceDataSubType) as PaymentMethod;
  await payment.save();
  if (payment.userId) {
    const subscription = await Subscriptions.findOne({ userId: payment.userId });
    if (subscription) {
      subscription.status = 'active';
      subscription.paidStart = new Date();
      subscription.paidEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      subscription.trialStart = undefined;
      subscription.trialEnd = undefined;
      await subscription.save();
    }
  }
  await sendPaymentConfirmationEmail(payment);
  return { message: 'Payment processed successfully' };
}

export async function processPaymentFailure(paymentData: {
  paymobOrderId: string;
  transactionId: string;
  errorMessage?: string;
}) {
  const { paymobOrderId, transactionId, errorMessage } = paymentData;
  const payment = await Payments.findOne({ paymobOrderId });
  if (!payment) {
    throw new Errors.NotFoundError(errMsg.PAYMENT_NOT_FOUND)
  }
  payment.paymentStatus = 'Failed';
  payment.transactionId = transactionId;
  await payment.save();
  await sendPaymentFailureEmail(payment, errorMessage);
  return { message: 'Payment failure processed' };
}

export async function processPaymentRefund(paymentData: {
  paymobOrderId: string;
  transactionId: string;
}) {
  const { paymobOrderId, transactionId } = paymentData;
  const payment = await Payments.findOne({ paymobOrderId });
  if (!payment) {
    throw new Errors.NotFoundError(errMsg.PAYMENT_NOT_FOUND)
  }
  payment.paymentStatus = 'Refunded';
  payment.transactionId = transactionId;
  await payment.save();
  if (payment.userId) {
    const subscription = await Subscriptions.findOne({ userId: payment.userId });
    if (subscription) {
      subscription.status = 'expired';
      await subscription.save();
    }
  }
  await sendRefundNotificationEmail(payment);
  return { message: 'Payment refund processed' };
}

function mapPaymentMethod(sourceDataType?: string, sourceDataSubType?: string): string {
  if (sourceDataType === 'card') {
    return 'CreditCard';
  } else if (sourceDataType === 'wallet') {
    if (sourceDataSubType === 'vodafone') {
      return 'VodafoneCash';
    } else if (sourceDataSubType === 'orange') {
      return 'OrangeMoney';
    } else if (sourceDataSubType === 'etisalat') {
      return 'EtisalatWallet';
    } else {
      return 'PaymobWallet';
    }
  } else if (sourceDataType === 'fawry') {
    return 'Fawry';
  } else {
    return 'Unknown';
  }
}

async function sendPaymentConfirmationEmail(payment: any) {
  const user = await Users.findById(payment.userId);
  if (user) {
    sendEmail(
      user.email,
      'Payment Successful - Subscription Activated',
      `
      <h2>Payment Successful!</h2>
      <p>Dear ${user.name},</p>
      <p>Your payment has been processed successfully.</p>
      <p>Your subscription is now active and you have access to all features.</p>
      <p>Transaction ID: ${payment.transactionId}</p>
      <p>Thank you for choosing our service!</p>
      `
    );
  }
}

async function sendPaymentFailureEmail(payment: any, errorMessage?: string) {
  const user = await Users.findById(payment.userId);
  if (user) {
    sendEmail(
      user.email,
      'Payment Failed',
      `
      <h2>Payment Failed</h2>
      <p>Dear ${user.name},</p>
      <p>Unfortunately, your payment could not be processed. Please try again or contact support if the issue persists.</p>
      <p>Transaction ID: ${payment.transactionId}</p>
      ${errorMessage ? `<p>Error: ${errorMessage}</p>` : ''}
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      `
    );
  }
}

async function sendRefundNotificationEmail(payment: any) {
  const user = await Users.findById(payment.userId);
  if (user) {
    sendEmail(
      user.email,
      'Payment Refunded',
      `
      <h2>Payment Refunded</h2>
      <p>Dear ${user.name},</p>
      <p>Your payment has been refunded.</p>
      <p>Your subscription has been expired. You can subscribe again anytime.</p>
      <p>Transaction ID: ${payment.transactionId}</p>
      <p>If you have any questions, please contact our support team.</p>
      `
    );
  }
}

export async function getPaymentHistory(userId: string) {
  const payments = await Payments.find({ userId })
    .sort({ createdAt: -1 });
  return payments;
}

export async function getPaymentById(paymentId: string) {
  const payment = await Payments.findById(paymentId)
    .populate('userId', 'name email');
  if (!payment) {
    throw new Errors.NotFoundError(errMsg.PAYMENT_NOT_FOUND)
  }
  return payment;
} 