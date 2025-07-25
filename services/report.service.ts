import { Report } from "../models/Report";
import { Role } from "../models/Role";
import mongoose from "mongoose";
import { Errors } from "../errors";
import { Shops } from "../models/Shop";
import {IReport} from "../models/Report"
import { errMsg } from "../common/err-messages";
export async function createReport(reportData:IReport,shopName?:string) {

  if (shopName) {
    const shop = await Shops.findOne({ name: shopName }).lean();
    if (!shop) throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
     reportData.shopId=shop._id;
    // message is sent to the shop owner
    reportData.receiver = Role.SHOP_OWNER ;
  }  else {
    // message is sent to the admin
    reportData.receiver = Role.ADMIN;
  }

  const report = await Report.create(reportData);

  return report.toObject();
}


export const getAllAdminReports=async()=>{
    const adminReports=await Report.find({receiver:Role.ADMIN})
    .sort({ createdAt: -1 }).lean();
    return adminReports;
}

export const getAllShopReports=async(shopId: string)=>{

    const shopReports=await Report.find( {receiver: Role.SHOP_OWNER,
    shopId: new mongoose.Types.ObjectId(shopId)
  })
    .sort({ createdAt: -1 }).lean();
    return shopReports;
}