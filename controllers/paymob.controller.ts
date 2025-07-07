import { Request, Response, NextFunction } from 'express';
import { getPaymobToken, createPaymobOrder, getPaymobPaymentKey, getPaymobIframeUrl } from '../utils/paymob';
import { Users } from '../models/User';
import { Payments } from '../models/Payment';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';

export const initiatePaymobOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('=== PAYMOB ORDER ENDPOINT REACHED ===');
    console.log('Starting Paymob order initiation...');

    // No planId needed for single plan system
    const userId = (req as any).user?.userId;

    console.log('Request data:', { userId });

    if (!userId) {
      console.log('Missing userId');
      return next(new Errors.UnauthenticatedError(errMsg.USER_NOT_AUTHENTICATED));
    }

    console.log('Basic validation passed');

    // Check environment variables
    if (!process.env.PAYMOB_API_KEY) {
      console.error('PAYMOB_API_KEY is not set');
      return next(new Errors.BadRequestError(errMsg.PAYMOB_CONFIG_ERROR));
    }
    if (!process.env.PAYMOB_IFRAME_ID) {
      console.error('PAYMOB_IFRAME_ID is not set');
      return next(new Errors.BadRequestError(errMsg.PAYMOB_CONFIG_ERROR));
    }
    if (!process.env.PAYMOB_INTEGRATION_ID) {
      console.error('PAYMOB_INTEGRATION_ID is not set');
      return next(new Errors.BadRequestError(errMsg.PAYMOB_CONFIG_ERROR));
    }

    console.log('Environment variables check passed');

    // Hardcoded single plan details
    const plan = {
      name: 'Standard',
      price: 499, // EGP, or your actual price
      currency: 'EGP'
    };

    // Find the user to get billing data
    const user = await Users.findById(userId).select('name email phoneNumber');
    if (!user) {
      console.log('User not found for ID:', userId);
      return next(new Errors.NotFoundError(errMsg.USER_NOT_FOUND));
    }

    console.log('User found:', user.name, user.email);

    // Split name into first and last name (assuming name is "FirstName LastName")
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName || 'User';

    // Construct billing data
    const billingData = {
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      phone_number: user.phoneNumber,
      apartment: 'N/A',
      floor: 'N/A',
      street: 'N/A',
      building: 'N/A',
      city: 'N/A',
      state: 'N/A',
      country: 'EG',
      postal_code: '00000',
    };

    console.log('Billing data constructed:', billingData);

    // Step 1: Authenticate with Paymob
    console.log('Getting Paymob token...');
    const token = await getPaymobToken();
    console.log('Paymob token received');

    // Step 2: Create Paymob order (amount in cents)
    const amountCents = plan.price * 100;
    console.log('Creating Paymob order with amount:', amountCents, 'cents');
    const order = await createPaymobOrder(token, amountCents);
    console.log('Paymob order created:', order.id);

    // Step 3: Get payment key
    console.log('Getting payment key...');
    const paymentKey = await getPaymobPaymentKey(token, order.id, amountCents, billingData);
    console.log('Payment key received');

    // Step 4: Build iframe URL
    const iframeUrl = getPaymobIframeUrl(paymentKey);
    console.log('Iframe URL built');

    // Step 5: Save payment record
    console.log('Saving payment record...');
    await Payments.create({
      userId,
      paymobOrderId: order.id,
      paymobPaymentKey: paymentKey,
      amount: plan.price,
      paymentMethod: 'Unknown',
      paymentStatus: 'Pending',
    });
    console.log('Payment record saved');

    res.status(200).json({ iframeUrl });
  } catch (error) {
    console.error('Error in Paymob integration:', error);
    next(error);
  }
};