import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export enum ReservationStatus {
    Pending = 'Pending',
    Confirmed = 'Confirmed',
    Seated = 'Seated',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
    NoShow = 'No-show'
}

export interface ITableReservation {
    _id: ObjectId;
    shopId: ObjectId;
    userId: ObjectId;
    tableNumber: number;
    reservationDateTime: Date;
    numberOfGuests: number;
    status: ReservationStatus;
    createdAt: Date;
    updatedAt: Date;
}



const TableReservationSchema = new Schema<ITableReservation>({
    shopId: { type: Schema.Types.ObjectId, ref: collectionsName.SHOPS, required: true },
    userId: { type: Schema.Types.ObjectId, ref: collectionsName.USERS, required: true },
    tableNumber: { type: Number, required: true },
    reservationDateTime: { type: Date, required: true },
    numberOfGuests: { type: Number, min: 0, required: true },
    status: { type: String, enum: ReservationStatus, default: ReservationStatus.Pending, required: true },

},
    {
        timestamps: true,
        collection: collectionsName.TABLE_RESERVATIONS
    });


export const TableReservations = mongoose.model<ITableReservation>(collectionsName.TABLE_RESERVATIONS, TableReservationSchema);
