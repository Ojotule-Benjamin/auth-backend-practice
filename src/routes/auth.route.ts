import express from "express";
import { login, logout, refreshToken, register } from "@/controllers/auth.controller";
import { validationRequest } from "@/middlewares/validateRequest";
import {
  loginValidator,
  logoutValidator,
  refreshTokenValidator,
  registerValidator,
} from "@/validators/validator";

const router = express.Router();

router.post("/register", registerValidator, validationRequest, register);
router.post("/login", loginValidator, validationRequest, login);
router.post("/refresh-token", refreshTokenValidator, validationRequest, refreshToken);
router.post("/logout", logoutValidator, validationRequest, logout);

export default router;
