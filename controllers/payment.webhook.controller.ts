import { Request, Response, NextFunction } from 'express';
import {
  processPaymentSuccess,
  processPaymentFailure,
  processPaymentRefund
} from '../services/payment.service';
import { Payments } from '../models/Payment';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const handlePaymobWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('=== PAYMOB WEBHOOK RECEIVED ===');
    console.log('Webhook data:', JSON.stringify(req.body, null, 2));

    // Extract essential data from webhook
    const {
      type,
      obj: {
        id: paymobOrderId,
        transaction_id,
        success,
        is_amount_paid,
        is_refunded,
        is_canceled,
        error_occured,
        source_data_type,
        source_data_sub_type,
        amount_cents,
        currency
      }
    } = req.body;

    console.log('Processing webhook for order:', paymobOrderId);
    console.log('Payment success:', success);
    console.log('Transaction ID:', transaction_id);

    // Check if payment record exists
    const existingPayment = await Payments.findOne({ paymobOrderId });
    if (!existingPayment) {
      console.error('Payment record not found for paymobOrderId:', paymobOrderId);
      console.log('Available payments in database:');
      const allPayments = await Payments.find({}).select('paymobOrderId paymentStatus amount');
      console.log(allPayments);
      // Still respond 200 to Paymob to avoid retries
      sendError(res, 200, 'Webhook received but processing failed', { error: 'Payment record not found', paymobOrderId });
      return;
    }

    console.log('Payment record found:', existingPayment._id);

    try {
      if (success && is_amount_paid && !is_refunded && !is_canceled) {
        // Payment successful
        console.log('Processing successful payment...');
        await processPaymentSuccess({
          paymobOrderId: paymobOrderId.toString(),
          transactionId: transaction_id,
          paymentMethod: 'Unknown',
          sourceDataType: source_data_type,
          sourceDataSubType: source_data_sub_type
        });
        console.log('Payment processed successfully');
      } else if (error_occured || is_canceled) {
        // Payment failed
        console.log('Processing failed payment...');
        await processPaymentFailure({
          paymobOrderId: paymobOrderId.toString(),
          transactionId: transaction_id,
          errorMessage: 'Payment was cancelled or failed'
        });
        console.log('Payment failure processed');
      } else if (is_refunded) {
        // Payment refunded
        console.log('Processing refund...');
        await processPaymentRefund({
          paymobOrderId: paymobOrderId.toString(),
          transactionId: transaction_id
        });
        console.log('Payment refund processed');
      }
      // Respond to Paymob
      sendSuccess(res, null, 'Webhook processed successfully');
    } catch (error) {
      console.error('Error processing payment:', error);
      // Still respond 200 to Paymob to avoid retries
      sendError(res, 200, 'Webhook received but processing failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    next(error);
  }
};

// Webhook verification endpoint (optional but recommended)
export const verifyWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // In a real implementation, you would verify the webhook signature
    // For now, we'll just log the verification request
    console.log('Webhook verification request received');
    sendSuccess(res, null, 'Webhook verified');
  } catch (error) {
    next(error);
  }
}; 