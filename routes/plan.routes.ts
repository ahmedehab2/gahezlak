import { Router } from "express";
import * as controllers from "../controllers/plans.controller";
import { protect } from "../middlewares/auth";
import {
  createPlanValidator,
  updatePlanValidator,
  activateOrDeactivatePlanValidator,
} from "../validators/plan.validator";

const planRoutes = Router();

planRoutes.post(
  "/",
  protect,
  createPlanValidator,
  controllers.createPlanHandler
);
planRoutes.get("/", controllers.getPlansHandler);
planRoutes.get("/:id", controllers.getPlanById);
planRoutes.put(
  "/:id",
  protect,
  updatePlanValidator,
  controllers.updatePlanHandler
);
planRoutes.patch(
  "/:id/activate",
  protect,
  activateOrDeactivatePlanValidator,
  controllers.activateOrDeactivatePlanHandler
);

export default planRoutes;
