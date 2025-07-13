import { SuccessResponse } from "../common/types/contoller-response.types";
import { IPlan } from "../models/plan";
import * as planService from "../services/plan.service";
import { RequestHandler } from "express";
// import { createSubscriptionPlan } from "../utils/paymob";
import { Errors } from "../errors";
import { errMsg } from "../common/err-messages";

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
> = async (req, res, next) => {
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
  // const paymobPlan = await createSubscriptionPlan({
  //   planName: planTitle,
  //   frequency,
  //   amountInCents: price * 100,
  //   startWithTrial: true,
  //   isActive: true,
  // }); disabled paymob integration for now
  const plan = await planService.createPlan({
    planGroup,
    title: planTitle,
    description,
    currency,
    frequency,
    features,
    price,
    isActive: true,
    // paymobPlanId: paymobPlan.id,
    trialPeriodDays,
  });
  res.status(201).json({
    message: "Plan created successfully",
    data: {},
  });
};

export const getPlanById: RequestHandler = async (req, res, next) => {
  try {
    const plan = await planService.getPlanById(req.params.id);
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
};

export const getPlansHandler: RequestHandler = async (req, res, next) => {
  const plans = await planService.getAllPlans();
  res.status(200).json({
    message: "Plans fetched successfully",
    data: plans,
  });
};
