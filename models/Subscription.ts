import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export type SubscriptionPlan = 'trial' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface ISubscription extends Document {
  userId: ObjectId;
  shopId?: ObjectId;
  plan: mongoose.Types.ObjectId;
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, ref: collectionsName.USERS, required: true },
  shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS },
  plan: { type: Schema.Types.ObjectId, ref: 'plans', required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], required: true },
  trialEndsAt: { type: Date },
}, {
  timestamps: true,
  collection: 'subscriptions',
});

export const Subscriptions = mongoose.model<ISubscription>('subscriptions', SubscriptionSchema); 