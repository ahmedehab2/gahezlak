import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export interface IMenuItem {
    _id: ObjectId;
    shopId: ObjectId;
    name: string;
    description: string;
    price: number;
    category: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}


const MenuItemSchema = new Schema<IMenuItem>({
    shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },

},
    {
        timestamps: true,
        collection: collectionsName.MENU_ITEMS
    }
);

export const MenuItemModel = mongoose.model<IMenuItem>(collectionsName.MENU_ITEMS, MenuItemSchema);
