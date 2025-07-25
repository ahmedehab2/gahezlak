import { RequestHandler } from "express";
import { createReport, getAllAdminReports, getAllShopReports } from "../services/report.service";

export const createReportController: RequestHandler = async (req, res) => {
  const reportData = req.body;
  const shopName=req.params.shopName
  const report = await createReport(reportData,shopName);

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
