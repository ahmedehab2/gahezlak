import mongoose, { Schema, Types } from "mongoose";
import { collectionsName } from "../common/collections-name";

export enum PaymentMethods {
  CreditCard = "CreditCard",
  DebitCard = "DebitCard",
  VodafoneCash = "VodafoneCash",
  OrangeMoney = "OrangeMoney",
  EtisalatWallet = "EtisalatWallet",
  Fawry = "Fawry",
  BankTransfer = "BankTransfer",
  Cash = "Cash",
}
export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface IPayment {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  planId?: Types.ObjectId;
  shopId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  guestInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumer: string;
  };

  // paymobOrderId?: string;
  // paymobPaymentKey?: string;
  paymentMethod: PaymentMethods;
  paymentStatus: PaymentStatus;
  amount: number;
  // transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: collectionsName.USERS },
    planId: { type: Schema.Types.ObjectId, ref: collectionsName.PLANS },
    shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS },
    orderId: { type: Schema.Types.ObjectId, ref: collectionsName.ORDERS },
    guestInfo: {
      type: new Schema(
        {
          firstName: { type: String, required: true },
          lastName: { type: String, required: true },
          email: { type: String, required: true },
          phoneNumber: { type: String, required: true },
        },
        { _id: false }
      ),
      required: false, // guestInfo is optional, but if provided, fields are required
    },
    // paymobOrderId: { type: String },
    // paymobPaymentKey: { type: String },
    paymentMethod: { type: String, enum: PaymentMethods },
    paymentStatus: {
      type: String,
      enum: PaymentStatus,
      default: PaymentStatus.COMPLETED,
    }, //mocking payment status for now
    amount: { type: Number, required: true },
    // transactionId: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
    collection: collectionsName.PAYMENTS,
  }
);

// Custom validation: either planId or orderId must be present, but not both
PaymentSchema.pre("validate", function (next) {
  if ((!this.planId && !this.orderId) || (this.planId && this.orderId)) {
    return next(
      new Error("Either planId or orderId must be set, but not both.")
    );
  }
  next();
});

export const Payments = mongoose.model<IPayment>(
  collectionsName.PAYMENTS,
  PaymentSchema
);
