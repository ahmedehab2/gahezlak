import { RequestHandler } from "express";
import { createAdminReport, createShopReport, getAllAdminReports, getAllShopReports } from "../services/report.service";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { IReport } from "../models/Report";

export const createShopReportController: RequestHandler<           //RequestHandler<params, res, body>   
{ shopName: string },  //params
SuccessResponse<IReport>, // response
Pick<IReport, "orderNumber" | "senderName" | "senderEmail" | "message" >> = async (req, res) => {  //body
 
  const shopName=req.params.shopName
  const report = await createShopReport(shopName,req.body);

  res.status(201).json({
    message: "Report submitted successfully",
    data: report,
  });
};


export const createAdminReportController: RequestHandler<
{}, //no params
SuccessResponse<IReport>, // response
Pick<IReport, "phoneNumber" | "senderName" | "senderEmail" | "message" | "shopName" >> = async (req, res) => {  //body

  const report = await createAdminReport(req.body);

  res.status(201).json({
    message: "Report submitted successfully",
    data: report,
  });
};

export const getAllAdminReportsController: RequestHandler = async (req, res) => {
  const reports = await getAllAdminReports();

  res.status(200).json({
    message: "Admin reports retrieved successfully",
    data: reports,
  });
};

export const getAllShopReportsController: RequestHandler = async (req, res) => {
  const shopId = req.user?.shopId!;
  const reports = await getAllShopReports(shopId);

  res.status(200).json({
    message: "Shop reports retrieved successfully",
    data: reports,
  });
};
