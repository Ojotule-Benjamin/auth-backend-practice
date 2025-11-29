import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "@/controllers/auth.controller";
import { validationRequest } from "@/middlewares/validateRequest";
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  logoutValidator,
} from "@/validators/validator";

const router = express.Router();

router.post("/register", registerValidator, validationRequest, register);
router.post("/login", loginValidator, validationRequest, login);
router.post(
  "/refresh-token",
  refreshTokenValidator,
  validationRequest,
  refreshToken
);
router.post("/logout", logoutValidator, validationRequest, logout);

export default router;
