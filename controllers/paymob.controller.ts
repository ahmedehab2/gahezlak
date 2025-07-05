import { Request, Response, NextFunction } from 'express';
import { getPaymobToken, createPaymobOrder, getPaymobPaymentKey, getPaymobIframeUrl } from '../utils/paymob';
import { Plans } from '../models/Plan';
import { Users } from '../models/User';
import { Payments } from '../models/Payment';
import { AppError } from '../utils/classError';

export const initiatePaymobOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('=== PAYMOB ORDER ENDPOINT REACHED ===');
    console.log('Starting Paymob order initiation...');
    
    const { planId } = req.body;
    const userId = (req as any).user?.userId;
    
    console.log('Request data:', { planId, userId });
    
    if (!planId) {
      console.log('Missing planId');
      return next(new AppError('planId is required.', 400));
    }
    
    if (!userId) {
      console.log('Missing userId');
      return next(new AppError('User not authenticated.', 401));
    }
    
    console.log('Basic validation passed');
    
    // Check environment variables
    if (!process.env.PAYMOB_API_KEY) {
      console.error('PAYMOB_API_KEY is not set');
      return next(new AppError('Paymob configuration error.', 500));
    }
    
    if (!process.env.PAYMOB_IFRAME_ID) {
      console.error('PAYMOB_IFRAME_ID is not set');
      return next(new AppError('Paymob configuration error.', 500));
    }
    
    if (!process.env.PAYMOB_INTEGRATION_ID) {
      console.error('PAYMOB_INTEGRATION_ID is not set');
      return next(new AppError('Paymob configuration error.', 500));
    }
    
    console.log('Environment variables check passed');
    
    // Find the plan
    const plan = await Plans.findById(planId);
    if (!plan) {
      console.log('Plan not found for ID:', planId);
      return next(new AppError('Plan not found.', 404));
    }
    
    console.log('Plan found:', plan.name, plan.price);
    
    // Find the user to get billing data
    const user = await Users.findById(userId).select('name email phoneNumber');
    if (!user) {
      console.log('User not found for ID:', userId);
      return next(new AppError('User not found.', 404));
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
      planId: plan._id,
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