import mongoose,{Schema} from "mongoose"
import { ObjectId }from "mongodb"
import { collectionsName } from "../common/collections-name";
import { Role } from "./Role";

export interface IReport{
    senderName?: string;
  senderEmail?: string;
    shopId?:ObjectId; // optional if receiver is ADMIN
    receiver:Role;
    message:string;
    
}



const ReportSchema=new Schema<IReport>({
    senderName:{type:String},
    senderEmail:{type:String},
    shopId:{type:Schema.Types.ObjectId,ref:collectionsName.SHOPS,required:false},
    receiver:{type:String, enum: Object.values(Role),required:true},
    message:{type:String,required:true},
   
},
{
    timestamps:true,
    collection:collectionsName.REPORT
})
export const Report=mongoose.model<IReport>(collectionsName.REPORT,ReportSchema)
