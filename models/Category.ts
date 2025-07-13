import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  shopId: mongoose.Types.ObjectId;
  name:string;
  description?:string;
  menuItems?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS, required: true },
  name: { type: String, required: true },
  description:{ type: String },
  menuItems: [{ type: Schema.Types.ObjectId, ref: collectionsName.MENU_ITEMS }],
}, {
  timestamps: true,
  collection: collectionsName.CATEGORIES
});

export const CategoryModel = mongoose.model<ICategory>(collectionsName.CATEGORIES, CategorySchema);

