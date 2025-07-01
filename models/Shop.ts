import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';



export interface IShopMember {
    userId: ObjectId;
    roleId: ObjectId;
}

export interface IShop {
    _id: ObjectId;
    name: string;
    type: string;
    address: string;
    phoneNumber: string;
    email: string;
    ownerId: ObjectId;
    members: IShopMember[];
    isPaymentDone: boolean;
    createdAt: Date;
    updatedAt: Date;
}




const ShopSchema = new Schema<IShop>({
    name: { type: String, required: true },
    type: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: collectionsName.USERS, required: true },
    isPaymentDone: { type: Boolean, default: false },
    members: [{
        userId: { type: Schema.Types.ObjectId, ref: collectionsName.USERS, required: true },
        roleId: { type: Schema.Types.ObjectId, ref: 'roles', required: true },
    }],

},
    {

        timestamps: true,
        collection: collectionsName.SHOPS
    });

export const Shops = mongoose.model<IShop>(collectionsName.SHOPS, ShopSchema);
