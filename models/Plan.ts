import mongoose, { Schema, Document, model } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  price: number; // price in the specified currency
  currency: string; // currency code (EGP, USD, etc.)
  duration: number; // duration in days
  itemLimit: number;
  categoryLimit: number;
  features: string[];
  isActive: boolean; // 
}

const PlanSchema = new Schema<IPlan>({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  currency: { type: String, required: true, default: 'EGP', enum: ['EGP', 'USD', 'EUR'] },
  duration: { type: Number, required: true },
  itemLimit: { type: Number, required: true },
  categoryLimit: { type: Number, required: true },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'plans',
});

export const Plans = model<IPlan>('plans', PlanSchema); 