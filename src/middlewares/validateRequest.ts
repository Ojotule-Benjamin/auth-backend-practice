import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { STATUS } from "@/constants/statusCodes";
import { ApiResponse } from "@/utils/ApiResponse";

export const validationRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors
      .array()
      .map((err) => err.msg)
      .join(", ");

    return ApiResponse.error({
      error: undefined,
      message: formattedErrors,
      res,
      status: STATUS.BAD_REQUEST,
    });
  }
  next();
};
