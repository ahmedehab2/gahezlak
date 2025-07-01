import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export type PaymentMethod =
    | 'CreditCard'
    | 'DebitCard'
    | 'Cash'
    | 'DigitalWallet'
    | 'BankTransfer';

export type PaymentStatus =
    | 'Pending'
    | 'Processing'
    | 'Completed'
    | 'Failed'
    | 'Refunded';

export interface IPayment {
    _id: ObjectId;
    shopId: ObjectId;
    orderId: ObjectId;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    amount: number;
    transactionId: string;
    createdAt: Date;
    updatedAt: Date;
}



const PaymentSchema = new Schema<IPayment>({
    shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: collectionsName.ORDERS, required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true, unique: true },

},
    {
        timestamps: true,
        collection: collectionsName.PAYMENTS
    });

export const Payments = mongoose.model<IPayment>(collectionsName.PAYMENTS, PaymentSchema);
