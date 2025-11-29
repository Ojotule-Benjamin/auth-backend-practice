import express, { type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest, IUser } from "@/types/index.ds";

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
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
};
