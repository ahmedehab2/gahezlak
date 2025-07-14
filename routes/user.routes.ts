import { Router } from "express";
import {
  requestEmailChangeHandler,
  confirmEmailChangeHandler,
  getUserProfileHandler,
  updateUserProfileHandler,
  getAllUsersHandler,
  getUserByIdHandler,
} from "../controllers/user.controller";
import {
  validateRequestEmailChange,
  validateConfirmEmailChange,
  validateUpdateProfile,
  validateGetAllUsers,
  validateUserId,
} from "../validators/user.validator";
import { protect } from "../middlewares/auth";

const router = Router();

// User profile endpoints (authenticated users)
router.get("/profile", protect, getUserProfileHandler);
router.put("/profile", protect, validateUpdateProfile, updateUserProfileHandler);

// Email change endpoints (authenticated users)
router.post(
  "/request-email-change",
  protect,
  validateRequestEmailChange,
  requestEmailChangeHandler
);
router.post(
  "/confirm-email-change",
  protect,
  validateConfirmEmailChange,
  confirmEmailChangeHandler
);

// Admin endpoints (should add admin middleware later)
router.get("/users", protect, validateGetAllUsers, getAllUsersHandler);
router.get("/users/:id", protect, validateUserId, getUserByIdHandler);

export default router;
