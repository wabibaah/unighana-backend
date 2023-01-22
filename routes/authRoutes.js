import express from "express";
const router = express.Router();

import {
  createUser,
  loginUser,
  handleRefreshToken,
  logoutUser,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
} from "../controllers/userController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

router.post("/register", createUser);
router.post("/login", loginUser);

router.get("/refresh", handleRefreshToken); // must be here so that it will not use refresh as an id to say invalid
router.get("/logout", logoutUser);

router.put("/password", authMiddleware, updatePassword);

router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);

export default router;
