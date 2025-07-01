import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export interface IRole {
    _id: ObjectId;
    role: string;
    permissions?: string[];
}



const RoleSchema = new Schema<IRole>({
    role: { type: String, required: true },
    permissions: { type: [String], default: [] },
});

export const Roles = mongoose.model<IRole>(collectionsName.ROLES, RoleSchema);
