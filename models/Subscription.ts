import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export type SubscriptionStatus = 'trial' | 'active' | 'expired';
export enum status {
  TRIAL = 'trial',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export interface ISubscription extends Document {
  userId: ObjectId;
  status: SubscriptionStatus;
  trialStart: Date;
  trialEnd: Date;
  paidStart?: Date;
  paidEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, ref: collectionsName.USERS, required: true },
  status: { type: String, enum: status, default: status.TRIAL },
  trialStart: { type: Date, required: false },
  trialEnd: { type: Date, required: false },
  paidStart: { type: Date },
  paidEnd: { type: Date },
}, {
  timestamps: true,
  collection: collectionsName.SUBSCRIPTIONS,
});

// Static method to auto-expire subscriptions
SubscriptionSchema.statics.autoExpireIfNeeded = async function (subscriptionId: ObjectId) {
  const sub = await this.findById(subscriptionId);
  if (!sub) return;
  const now = new Date();
  if (sub.status === 'trial' && sub.trialEnd < now) {
    sub.status = 'expired';
    await sub.save();
  } else if (sub.status === 'active' && sub.paidEnd && sub.paidEnd < now) {
    sub.status = 'expired';
    await sub.save();
  }
};

export const Subscriptions = mongoose.model<ISubscription>(collectionsName.SUBSCRIPTIONS, SubscriptionSchema); 
