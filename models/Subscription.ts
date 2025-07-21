import { ObjectId } from "mongodb";
import mongoose, { Schema, Document } from "mongoose";
import { collectionsName } from "../common/collections-name";
import { IShop } from "./Shop";
import { IPlan } from "./plan";

export enum SubscriptionStatus {
  TRIALING = "trialing",
  ACTIVE = "active", // Actively paid
  PENDING = "pending", // Waiting for initial payment confirmation
  CANCELLED = "cancelled", // User cancelled, will expire at period end
  EXPIRED = "expired", // Past due, access revoked
}

export interface ISubscription extends Document {
  userId: ObjectId;
  shop: ObjectId | IShop;
  plan: ObjectId | IPlan; // Link to the plan they are on
  status: SubscriptionStatus;
  paymobSubscriptionId?: number; // To manage the subscription in Paymob
  paymobTransactionId?: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date; // A single field to track when the current period (trial or paid) ends
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: collectionsName.USERS,
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: collectionsName.SHOPS,
      required: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: collectionsName.PLANS,
      required: true,
    },
    status: {
      type: String,
      enum: SubscriptionStatus,
      default: SubscriptionStatus.TRIALING,
    },
    paymobSubscriptionId: {
      type: String,
      required: true,
    },
    paymobTransactionId: {
      type: Number,
      required: true,
    },

    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
    collection: collectionsName.SUBSCRIPTIONS,
  }
);

export const Subscriptions = mongoose.model<ISubscription>(
  collectionsName.SUBSCRIPTIONS,
  SubscriptionSchema
);
