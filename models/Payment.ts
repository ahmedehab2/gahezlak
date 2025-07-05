import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export type PaymentMethod =
    | 'CreditCard'
    | 'DebitCard'
    | 'VodafoneCash'
    | 'OrangeMoney'
    | 'EtisalatWallet'
    | 'Fawry'
    | 'BankTransfer'
    | 'CashOnDelivery'
    | 'PaymobWallet'
    | 'Meza'
    | 'Unknown';

export type PaymentStatus =
    | 'Pending'
    | 'Processing'
    | 'Completed'
    | 'Failed'
    | 'Refunded';

export interface IPayment {
    _id: ObjectId;
    userId?: ObjectId;
    planId?: ObjectId;
    shopId?: ObjectId;
    orderId?: ObjectId;
    paymobOrderId?: string;
    paymobPaymentKey?: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    amount: number;
    transactionId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
    userId: { type: Schema.Types.ObjectId, ref: collectionsName.USERS },
    planId: { type: Schema.Types.ObjectId, ref: 'plans' },
    shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS },
    orderId: { type: Schema.Types.ObjectId, ref: collectionsName.ORDERS },
    paymobOrderId: { type: String },
    paymobPaymentKey: { type: String },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, unique: true, sparse: true },
},
    {
        timestamps: true,
        collection: collectionsName.PAYMENTS
    });

export const Payments = mongoose.model<IPayment>(collectionsName.PAYMENTS, PaymentSchema);
