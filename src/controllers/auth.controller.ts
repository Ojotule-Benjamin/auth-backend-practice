import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { STATUS } from "@/constants/statusCodes";
import { ApiResponse } from "@/utils/ApiResponse";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from "@/utils/jwt.utils";
import user from "@/models/user.model";
import session from "@/models/session.model";
import crypto from "crypto";

export function hashtoken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const register = async (req: Request, res: Response) => {
  const {
    firstName,
    middleName,
    lastName,
    age,
    state,
    country,
    email,
    password,
    phoneNumber,
    role,
    isVerified,
  } = req.body;

  try {
    const existsingUser = await user.findOne({ email });
    if (existsingUser) {
      return ApiResponse.error({
        res,
        status: STATUS.CONFLICT,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = await user.create({
      email: email,
      password: hashed,
      firstName: firstName,
      lastName: lastName,
      middleName: middleName ?? undefined,
      age: age,
      state: state,
      country: country,
      phoneNumber: phoneNumber,
      role: role,
      isVerified: isVerified,
    });

    return ApiResponse.success({
      res,
      status: STATUS.CREATED,
      message: "User registered successfully",
      data: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        middleName: newUser.middleName ?? undefined,
        email: newUser.email,
        age: newUser.age,
        state: newUser.state,
        country: newUser.country,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        isVerified: newUser.isVerified,
      },
    });

    // res.status(STATUS.CREATED).json({
    //   message: "User registered successfully",
    //   user: {
    //     id: newUser._id,
    //     firstName: newUser.firstName,
    //     lastName: newUser.lastName,
    //     middleName: newUser.middleName ?? undefined,
    //     email: newUser.email,
    //     age: newUser.age,
    //     state: newUser.state,
    //     country: newUser.country,
    //     phoneNumber: newUser.phoneNumber,
    //     role: newUser.role,
    //     isVerified: newUser.isVerified,
    //   },
    // });
  } catch (error: unknown) {
    let errMsg: string | object;
    if (error instanceof Error) {
      errMsg = error.message;
    } else {
      errMsg = error || "Unknown error";
    }

    return ApiResponse.error({ res, error: errMsg });
  }
};

export const login = async (req: Request, res: Response) => {
  const platform = req.headers["x-client-type"];

  const { email, password } = req.body;

  try {
    const existingUser = await user.findOne({ email });

    if (!existingUser) {
      return ApiResponse.error({
        res,
        status: STATUS.NOT_FOUND,
        message: "User not found",
      });
    }

    const isPasswwordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswwordValid) {
      return ApiResponse.error({
        res,
        status: STATUS.UNAUTHORIZED,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken({
      id: existingUser._id.toString(),
      email: existingUser.email.toString(),
    });

    const refreshToken = generateRefreshToken({
      id: existingUser._id.toString(),
      email: existingUser.email.toString(),
    });

    const hashedRefreshToken = hashtoken(refreshToken);

    const { password: _pwd, ...userWithoutPassword } = existingUser.toObject();

    //store refresh token in session
    await session.create({
      userId: existingUser._id,
      refreshToken: hashedRefreshToken,
      userAgent: req.get("User-Agent") || "",
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    /* detect platform (web vs mobile client) in the login controller — 
   so you can use HttpOnly cookies for web and token-in-response for mobile. */

    if (platform === "web") {
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return ApiResponse.success({
        res,
        message: "Login successful",
        data: {
          ...userWithoutPassword,
          accessToken,
        },
      });
    }

    if (platform === "mobile") {
      return ApiResponse.success({
        res,
        message: "Login successful",
        data: {
          ...userWithoutPassword,
          accessToken,
          refreshToken,
        },
      });
    }
  } catch (error: unknown) {
    let errMsg: string | object;
    if (error instanceof Error) {
      errMsg = error.message;
    } else {
      errMsg = error || "Unknown error";
    }

    return ApiResponse.error({ res, error: errMsg });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    const incomingHashedToken = hashtoken(refreshToken);

    if (!incomingHashedToken) {
      return ApiResponse.error({
        res,
        status: STATUS.UNAUTHORIZED,
        message: "Refresh token not provided",
      });
    }

    const existingSession = await session.findOne({
      refreshToken: incomingHashedToken,
    });
    if (!existingSession) {
      return ApiResponse.error({
        res,
        status: STATUS.UNAUTHORIZED,
        message: "Invalid refresh token",
      });
    }

    const userId = existingSession.userId;

    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return ApiResponse.error({
        res,
        status: STATUS.UNAUTHORIZED,
        message: "User not found",
      });
    }
    const newAccessToken = generateAccessToken({
      id: existingUser._id.toString(),
      email: existingUser.email,
    });

    const newRefreshToken = generateRefreshToken({
      id: existingUser._id.toString(),
      email: existingUser.email,
    });

    const hashedNewRefreshToken = hashtoken(newRefreshToken);

    //update session with new refresh token
    existingSession.refreshToken = hashedNewRefreshToken;
    existingSession.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await existingSession.save();

    //set new refresh token in cookie if web client
    const platform = req.headers["x-client-type"];
    if (platform === "web") {
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        //secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    return ApiResponse.success({
      res,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: platform === "mobile" ? newRefreshToken : undefined,
      },
    });
  } catch (error) {
    let errMsg: string | object;
    if (error instanceof Error) {
      errMsg = error.message;
    } else {
      errMsg = error || "Unknown error";
    }

    return ApiResponse.error({ res, error: errMsg });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const incomingHashedToken = hashtoken(refreshToken);

    if (!incomingHashedToken) {
      return ApiResponse.error({
        res,
        status: STATUS.BAD_REQUEST,
        message: "Refresh token not provided",
      });
    }

    //delete session
    await session.findOneAndDelete({ refreshToken: incomingHashedToken });

    //clear cookie if web client
    const platform = req.headers["x-client-type"];
    if (platform === "web") {
      res.clearCookie("refreshToken");
    }

    return ApiResponse.success({
      res,
      message: "Logged out successfully",
    });
  } catch (error) {
    let errMsg: string | object;
    if (error instanceof Error) {
      errMsg = error.message;
    } else {
      errMsg = error || "Unknown error";
    }

    return ApiResponse.error({ res, error: errMsg });
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
};
