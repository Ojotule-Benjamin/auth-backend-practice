import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResponse";
import { STATUS } from "@/constants/statusCodes";

export const validationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors
      .array()
      .map((err) => err.msg)
      .join(", ");

    return ApiResponse.error({
      res,
      status: STATUS.BAD_REQUEST,
      message: formattedErrors,
      error: undefined,
    });
  }
  next();
};
