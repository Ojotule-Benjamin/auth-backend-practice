import type { Response } from "express";
import type mongoose from "mongoose";
import type { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  age: Date;
  state: string;
  country: string;
  phoneNumber: string;
  role: "user" | "admin";
  isVerified: boolean;
  refreshToken?: string;
}

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt?: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface ApiResponseOptions<T = unknown> {
  res: Response;
  status?: number;
  message?: string;
  data?: T;
  error?: string | object;
}
