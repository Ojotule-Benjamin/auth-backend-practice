import express, { type NextFunction, type Response } from "express";
import type { AuthRequest } from "@/types/index.ds";

export const permit = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: You don't have enough permissions to access this resource.",
      });
    }
    next();
  };
};
