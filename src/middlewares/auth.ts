import express, { type NextFunction, type Response } from "express";
import jwt from "jsonwebtoken";
import { STATUS } from "@/constants/statusCodes";
import type { AuthRequest, IUser } from "@/types/index.ds";
import { ApiResponse } from "@/utils/ApiResponse";

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.get("authorization")?.split(" ")[1];
  console.log("Token:", token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    // Verify token logic here
    // If valid, attach user to req.user
    const decodedUser = jwt.verify(token, process.env.JWT_SECRET || "");
    req.user = decodedUser as IUser;
    next();
  } catch (error) {
    return ApiResponse.error({
      message: "Token is invalid or expired",
      res,
      status: STATUS.UNAUTHORIZED,
    });
  }
};
