import mongoose,{Schema} from "mongoose"
import { ObjectId }from "mongodb"
import { collectionsName } from "../common/collections-name";
import { Role } from "./Role";

export interface IReport{
    shopId?:ObjectId; // optional if receiver is ADMIN
    receiver:Role.SHOP_OWNER|Role.SHOP_MANAGER | Role.ADMIN;
    message:String;
    createdAt: Date;
    updatedAt: Date;
}



const ReportSchema=new Schema<IReport>({
    shopId:{type:Schema.Types.ObjectId,ref:collectionsName.SHOPS,required:false},
    receiver:{type:String, enum: Object.values(Role),required:true},
    message:{type:String,required:true},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},
{
    timestamps:true,
    collection:collectionsName.REPORT
})
export const Report=mongoose.model<IReport>(collectionsName.REPORT,ReportSchema)
