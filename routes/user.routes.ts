import { Router } from "express";
import {
  requestEmailChangeHandler,
  confirmEmailChangeHandler,
  getUserProfileHandler,
  updateUserProfileHandler,
  getAllUsersHandler,
  getUserByIdHandler,
  changePasswordHandler,
} from "../controllers/user.controller";
import {
  validateRequestEmailChange,
  validateConfirmEmailChange,
  validateUpdateProfile,
  validateGetAllUsers,
  validateUserId,
  validateChangePassword,
} from "../validators/user.validator";
import { protect } from "../middlewares/auth";

const router = Router();

// User profile endpoints (authenticated users)
router.get("/profile", protect, getUserProfileHandler);
router.put("/profile", protect, validateUpdateProfile, updateUserProfileHandler);

// Change password endpoint (authenticated users)
router.put("/change-password", protect, validateChangePassword, changePasswordHandler);

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

// Admin endpoints
router.get("/", protect, validateGetAllUsers, getAllUsersHandler);
router.get("/:id", protect, validateUserId, getUserByIdHandler);

export default router;
