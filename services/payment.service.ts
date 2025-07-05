import { Payments, PaymentMethod } from '../models/Payment';
import { Subscriptions } from '../models/Subscription';
import { Plans } from '../models/Plan';
import { Users } from '../models/User';
import { sendEmail } from '../utils/sendEmail';
import { AppError } from '../utils/classError';

export class PaymentService {
  static async processPaymentSuccess(paymentData: {
    paymobOrderId: string;
    transactionId: string;
    paymentMethod: string;
    sourceDataType?: string;
    sourceDataSubType?: string;
  }) {
    const { paymobOrderId, transactionId, paymentMethod, sourceDataType, sourceDataSubType } = paymentData;

    // Find the payment record
    const payment = await Payments.findOne({ paymobOrderId });
    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    // Update payment status
    payment.paymentStatus = 'Completed';
    payment.transactionId = transactionId;
    payment.paymentMethod = this.mapPaymentMethod(sourceDataType, sourceDataSubType) as PaymentMethod;
    await payment.save();

    // Update subscription
    if (payment.planId && payment.userId) {
      const subscription = await Subscriptions.findOne({ userId: payment.userId });
      if (subscription) {
        subscription.plan = payment.planId;
        subscription.status = 'active';
        subscription.trialEndsAt = undefined; // Remove trial period
        await subscription.save();
      }
    }

    // Send confirmation email
    await this.sendPaymentConfirmationEmail(payment);

    return { message: 'Payment processed successfully' };
  }

  static async processPaymentFailure(paymentData: {
    paymobOrderId: string;
    transactionId: string;
    errorMessage?: string;
  }) {
    const { paymobOrderId, transactionId, errorMessage } = paymentData;

    // Find the payment record
    const payment = await Payments.findOne({ paymobOrderId });
    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    // Update payment status
    payment.paymentStatus = 'Failed';
    payment.transactionId = transactionId;
    await payment.save();

    // Send failure notification email
    await this.sendPaymentFailureEmail(payment, errorMessage);

    return { message: 'Payment failure processed' };
  }

  static async processPaymentRefund(paymentData: {
    paymobOrderId: string;
    transactionId: string;
  }) {
    const { paymobOrderId, transactionId } = paymentData;

    // Find the payment record
    const payment = await Payments.findOne({ paymobOrderId });
    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    // Update payment status
    payment.paymentStatus = 'Refunded';
    payment.transactionId = transactionId;
    await payment.save();

    // Handle subscription cancellation
    if (payment.userId) {
      const subscription = await Subscriptions.findOne({ userId: payment.userId });
      if (subscription) {
        subscription.status = 'cancelled';
        await subscription.save();
      }
    }

    // Send refund notification email
    await this.sendRefundNotificationEmail(payment);

    return { message: 'Payment refund processed' };
  }

  private static mapPaymentMethod(sourceDataType?: string, sourceDataSubType?: string): string {
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

  private static async sendPaymentConfirmationEmail(payment: any) {
    const user = await Users.findById(payment.userId);
    const plan = await Plans.findById(payment.planId);
    
    if (user && plan) {
      await sendEmail(
        user.email,
        'Payment Successful - Subscription Activated',
        `
        <h2>Payment Successful!</h2>
        <p>Dear ${user.name},</p>
        <p>Your payment of ${payment.amount} ${plan.currency} for the ${plan.name} plan has been processed successfully.</p>
        <p>Your subscription is now active and you have access to all premium features.</p>
        <p>Transaction ID: ${payment.transactionId}</p>
        <p>Thank you for choosing our service!</p>
        `
      );
    }
  }

  private static async sendPaymentFailureEmail(payment: any, errorMessage?: string) {
    const user = await Users.findById(payment.userId);
    
    if (user) {
      await sendEmail(
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

  private static async sendRefundNotificationEmail(payment: any) {
    const user = await Users.findById(payment.userId);
    const plan = await Plans.findById(payment.planId);
    
    if (user && plan) {
      await sendEmail(
        user.email,
        'Payment Refunded',
        `
        <h2>Payment Refunded</h2>
        <p>Dear ${user.name},</p>
        <p>Your payment of ${payment.amount} ${plan.currency} for the ${plan.name} plan has been refunded.</p>
        <p>Your subscription has been cancelled. You can subscribe again anytime.</p>
        <p>Transaction ID: ${payment.transactionId}</p>
        <p>If you have any questions, please contact our support team.</p>
        `
      );
    }
  }

  static async getPaymentHistory(userId: string) {
    const payments = await Payments.find({ userId })
      .populate('planId', 'name price currency')
      .sort({ createdAt: -1 });
    
    return payments;
  }

  static async getPaymentById(paymentId: string) {
    const payment = await Payments.findById(paymentId)
      .populate('planId', 'name price currency')
      .populate('userId', 'name email');
    
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }
    
    return payment;
  }
} 