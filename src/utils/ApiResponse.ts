import type { Response } from "express";
import { STATUS } from "@/constants/statusCodes";
import type { ApiResponseOptions } from "../types/index.ds.ts";

export class ApiResponse {
  static success<T = unknown>({
    res,
    status = STATUS.OK,
    message = "Successs",
    data,
  }: ApiResponseOptions<T>) {
    return res.status(status).json({
      success: true,
      message,
      data: data ?? undefined,
    });
  }

  static error<T = unknown>({
    res,
    status = STATUS.INTERNAL_ERROR,
    message = "opps! Something went wrong!",
    error,
  }: ApiResponseOptions<T>) {
    return res.status(status).json({
      success: false,
      message,
      error: error ?? undefined,
    });
  }
}
