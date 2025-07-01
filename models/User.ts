import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document, model } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export interface IUser {
    _id: ObjectId;
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
    verificationCode: {
        code: string | null;
        expireAt: Date | null;
        reason: string | null;
    };
}



const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    verificationCode: {
        code: { type: String, default: null },
        expireAt: { type: Date, default: null },
        reason: { type: String, default: null }
    },
}
    , {
        timestamps: true,
        collection: collectionsName.USERS
    });

export const Users = model<IUser>(collectionsName.USERS, UserSchema);
