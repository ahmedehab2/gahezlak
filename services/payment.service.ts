import { Payments, IPayment } from "../models/Payment";
import { ObjectId } from "mongodb";

export async function createPaymentForPlan(
  paymentData: Pick<
    IPayment,
    "userId" | "planId" | "shopId" | "amount" | "paymentMethod"
  >
): Promise<IPayment> {
  const payment = Payments.create(paymentData);
  return payment;
}

export async function createPaymentForOrder(
  paymentData: Pick<
    IPayment,
    "userId" | "orderId" | "shopId" | "amount" | "paymentMethod" | "guestInfo"
  >
): Promise<IPayment> {
  const payment = Payments.create(paymentData);
  return payment;
}

export async function getPaymentById(
  paymentId: ObjectId
): Promise<IPayment | null> {
  return Payments.findById(paymentId).lean();
}

export async function updatePaymentStatus(
  paymentId: ObjectId,
  status: IPayment["paymentStatus"]
): Promise<IPayment | null> {
  return Payments.findByIdAndUpdate(
    paymentId,
    { paymentStatus: status },
    { new: true }
  ).lean();
}

export async function listPaymentsByUser(
  userId: ObjectId
): Promise<IPayment[]> {
  return Payments.find({ userId }).lean();
}

export async function listPaymentsByGuestEmail(
  email: string
): Promise<IPayment[]> {
  return Payments.find({ "guestInfo.email": email }).lean();
}
