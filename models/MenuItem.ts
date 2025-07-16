import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export interface IMenuItem {
  _id: ObjectId;
  shopId: ObjectId;
  name:{
    en: string;
    ar:string;
  };
  description?:{
    en: string;
    ar:string;
  };
    price: number;
  categoryId: ObjectId;
  isAvailable: boolean;
  imgUrl?: string;
  discount?: number; // percentage
  options?: Array<{
    name: string;
    type: 'single' | 'multiple';
    required: boolean;
    choices: Array<{
      name: string;
      price: number;
    }>
  }>;
  createdAt: Date;
  updatedAt: Date;
}


const MenuItemSchema = new Schema<IMenuItem>({
  shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS, required: true },
  name: {
    en: { type: String, required: true },
    ar: { type: String, required: true },
  },
  description: { 
    en: { type: String },
    ar: { type: String },
   },
  price: { type: Number, required: true },
  categoryId: { type:Schema.Types.ObjectId, ref: collectionsName.CATEGORIES, required: true },
  isAvailable: { type: Boolean, default: true },
  imgUrl: { type: String },
  discount: { type: Number, min: 0, max: 100 },
  options: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['single', 'multiple'], required: true },
    required: { type: Boolean, default: false },
    choices: [{
      name: { type: String, required: true },
      price: { type: Number, default: 0 }
    }]
  }]
}, {
  timestamps: true,
  collection: collectionsName.MENU_ITEMS
});


export const MenuItemModel = mongoose.model<IMenuItem>(collectionsName.MENU_ITEMS, MenuItemSchema);