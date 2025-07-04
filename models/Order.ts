import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export interface IOrderItem {
    menuItemId: ObjectId;
    quantity: number;
    customizationDetails: string;
    price: number;
}

export type OrderStatus =
    | 'Pending'
    | 'Confirmed'
    | 'Preparing'
    | 'Ready'
    | 'Delivered'
    | 'Cancelled';

export interface IOrder {
    _id: ObjectId;
    shopId: ObjectId;
    userId: ObjectId;
    tableNumber?: number;  // Optional field for dine-in orders
    orderStatus: OrderStatus;
    totalAmount: number;
    orderItems: IOrderItem[];
    createdAt: Date;
    updatedAt: Date;
}





const OrderSchema = new Schema<IOrder>({
    shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS, required: true },
    userId: { type: Schema.Types.ObjectId, ref: collectionsName.USERS, required: true },
    tableNumber: { type: Number },
    orderStatus: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    orderItems: [{
        menuItemId: { type: Schema.Types.ObjectId, ref: collectionsName.MENU_ITEMS, required: true },
        quantity: { type: Number, required: true },
        customizationDetails: { type: String },
        price: { type: Number, required: true },
    }],

}
    ,
    {
        timestamps: true,
        collection: collectionsName.ORDERS
    });

export const Orders = mongoose.model<IOrder>(collectionsName.ORDERS, OrderSchema);
