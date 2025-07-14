import mongoose, { Schema, Document } from "mongoose";
import { collectionsName } from "../common/collections-name";
import { IShop } from "./Shop";

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  shopId: mongoose.Types.ObjectId | IShop;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: collectionsName.SHOPS,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: { type: String },
  },
  {
    timestamps: true,
    collection: collectionsName.CATEGORIES,
  }
);

export const CategoryModel = mongoose.model<ICategory>(
  collectionsName.CATEGORIES,
  CategorySchema
);
