import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export interface IOrderItem {
    menuItemId: ObjectId;
    quantity: number;
    customizationDetails: string;
    price: number;
}

export enum OrderStatus { 
    Pending = 'Pending', 
    Confirmed = 'Confirmed',
     Preparing = 'Preparing',
      Ready = 'Ready',
       Delivered = 'Delivered', 
       Cancelled = 'Cancelled' } 

export interface IOrder {
    _id: ObjectId;
    shopId: ObjectId;
    tableNumber?: number;  // Optional field for dine-in orders
    orderStatus: OrderStatus;
    totalAmount: number;
    orderItems: IOrderItem[];
    isSentToKitchen: boolean; // Indicates if the order has been sent to the kitchen
    createdAt: Date;
    updatedAt: Date;
}





const OrderSchema = new Schema<IOrder>({
    shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS, required: true },
    tableNumber: { type: Number },
    orderStatus: { 
        type: String, 
        enum: Object.values(OrderStatus), 
        required: true,  
        default: OrderStatus.Pending 
    },
    totalAmount: { type: Number, required: true },
    orderItems: [{
        menuItemId: { type: Schema.Types.ObjectId, ref: collectionsName.MENU_ITEMS, required: true },
        quantity: { type: Number, required: true },
        customizationDetails: { type: String },
        price: { type: Number, required: true },
    }],
    isSentToKitchen: { type: Boolean, default: false}

}
    ,
    {
        timestamps: true,
        collection: collectionsName.ORDERS
    });

export const Orders = mongoose.model<IOrder>(collectionsName.ORDERS, OrderSchema);
