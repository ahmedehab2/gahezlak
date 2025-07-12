import { Router } from "express";
import * as controllers from "../controllers/plans.controller";
import { protect } from "../middlewares/auth";
import { createPlanValidator } from "../validators/plan.validator";

const planRoutes = Router();

planRoutes.post(
  "/",
  protect,
  createPlanValidator,
  controllers.createPlanHandler
);
planRoutes.get("/", controllers.getPlansHandler);

export default planRoutes;
