import { SuccessResponse } from "../common/types/contoller-response.types";
import { IPlan } from "../models/plan";
import * as planService from "../services/plan.service";
import { RequestHandler } from "express";
import { createSubscriptionPlan } from "../utils/paymob";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";
import { Role } from "../models/Role";
import { ProjectionFields } from "mongoose";

export const createPlanHandler: RequestHandler<
  unknown,
  SuccessResponse<{}>,
  Pick<
    IPlan,
    | "planGroup"
    | "description"
    | "currency"
    | "frequency"
    | "features"
    | "price"
    | "trialPeriodDays"
  >
> = async (req, res) => {
  const {
    planGroup,
    description,
    currency,
    frequency,
    features,
    price,
    trialPeriodDays,
  } = req.body;

  const planTitle = `${planGroup} (${frequency} - ${currency})`;

  const existingPlans = await planService.getPlanSByGroup(planGroup);

  // Check if a plan with the same group and frequency already exists
  const monthlyPlanExists = existingPlans.some(
    (plan) => plan.frequency === "monthly"
  );
  const yearlyPlanExists = existingPlans.some(
    (plan) => plan.frequency === "yearly"
  );

  if (frequency === "monthly" && monthlyPlanExists) {
    throw new Errors.BadRequestError(errMsg.MONTHLY_PLAN_EXISTS);
  }

  if (frequency === "yearly" && yearlyPlanExists) {
    throw new Errors.BadRequestError(errMsg.YEARLY_PLAN_EXISTS);
  }

  if (monthlyPlanExists && yearlyPlanExists) {
    throw new Errors.BadRequestError(errMsg.BOTH_PLANS_EXIST);
  }
  const paymobPlan = await createSubscriptionPlan({
    planName: planTitle,
    frequency,
    amountInCents: price * 100,
    startWithTrial: trialPeriodDays > 0 ? true : false,
    isActive: true,
  });
  await planService.createPlan({
    planGroup,
    title: planTitle,
    description,
    currency,
    frequency,
    features,
    price,
    isActive: true,
    paymobPlanId: paymobPlan.id,
    trialPeriodDays,
  });
  res.status(201).json({
    message: "Plan created successfully",
    data: {},
  });
};

export const getPlanById: RequestHandler<
  { id: string },
  SuccessResponse<IPlan>,
  unknown
> = async (req, res, next) => {
  const plan = await planService.getPlanById(req.params.id);
  res.status(200).json({
    message: "Plan fetched successfully",
    data: plan,
  });
};

export const getPlansHandler: RequestHandler<
  unknown,
  SuccessResponse<IPlan[]>,
  unknown
> = async (req, res, next) => {
  let select: ProjectionFields<IPlan> = {};

  if (req.user?.role !== Role.ADMIN) {
    select.paymobPlanId = 0; // Exclude paymobPlanId for non-admin users
  }
  const plans = await planService.getAllPlans(select);
  res.status(200).json({
    message: "Plans fetched successfully",
    data: plans,
  });
};

export const updatePlanHandler: RequestHandler<
  { id: string },
  SuccessResponse<IPlan>,
  Partial<Omit<IPlan, "_id" | "createdAt" | "updatedAt" | "isActive">>
> = async (req, res, next) => {
  const plan = await planService.updatePlan(req.params.id, req.body);
  res.status(200).json({
    message: "Plan updated successfully",
    data: plan,
  });
};

export const activateOrDeactivatePlanHandler: RequestHandler<
  { id: string },
  SuccessResponse<{}>,
  { isActive: boolean }
> = async (req, res, next) => {
  const plan = await planService.activateOrDeactivatePlan(
    req.params.id,
    req.body.isActive
  );
  res.status(200).json({
    message: `plan ${plan.isActive ? "activated" : "deactivated"} successfully`,
    data: {},
  });
};
