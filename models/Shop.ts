import { ObjectId } from "mongodb";
import mongoose, { Schema } from "mongoose";
import { collectionsName } from "../common/collections-name";

export interface IShopMember {
  userId: ObjectId;
  roleId: ObjectId;
}

export interface IShop {
  _id: ObjectId;
  name: string;
  type: string;
  address: {
    country: string;
    city: string;
    street: string;
  };
  phoneNumber: string;
  email: string;
  ownerId: ObjectId;
  members: IShopMember[];
  isPaymentDone: boolean;
  subscriptionId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    address: {
      country: { type: String, required: true },
      city: { type: String, required: true },
      street: { type: String, required: true },
    },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: collectionsName.USERS,
      required: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: collectionsName.SUBSCRIPTIONS,
      default: null,
    },
    members: {
      type: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: collectionsName.USERS,
            required: true,
          },
          roleId: {
            type: Schema.Types.ObjectId,
            ref: collectionsName.ROLES,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: collectionsName.SHOPS,
    versionKey: false,
  }
);

export const Shops = mongoose.model<IShop>(collectionsName.SHOPS, ShopSchema);
