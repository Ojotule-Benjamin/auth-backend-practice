import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { STATUS } from "@/constants/statusCodes";
import session from "@/models/session.model";
import user from "@/models/user.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { generateAccessToken, generateRefreshToken } from "@/utils/jwt.utils";

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
        message: "User already exists",
        res,
        status: STATUS.CONFLICT,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = await user.create({
      age: age ?? undefined,
      country: country ?? country,
      email: email,
      firstName: firstName,
      isVerified: isVerified,
      lastName: lastName,
      middleName: middleName ?? undefined,
      password: hashed,
      phoneNumber: phoneNumber,
      role: role,
      state: state ?? state,
    });

    return ApiResponse.success({
      data: {
        age: newUser.age ?? undefined,
        country: newUser.country ?? undefined,
        email: newUser.email,
        firstName: newUser.firstName,
        id: newUser._id,
        isVerified: newUser.isVerified,
        lastName: newUser.lastName,
        middleName: newUser.middleName ?? undefined,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        state: newUser.state ?? undefined,
      },
      message: "User registered successfully",
      res,
      status: STATUS.CREATED,
    });
  } catch (error: unknown) {
    let errMsg: string | object;

    if (error instanceof Error) {
      errMsg = error.message;
    } else {
      errMsg = error || "Unknown error";
    }

    return ApiResponse.error({ error: errMsg, res });
  }
};

export const login = async (req: Request, res: Response) => {
  const platform = req.headers["x-client-type"];

  if (!platform || (platform !== "web" && platform !== "mobile")) {
    return ApiResponse.error({
      message: "Kindly provide the x-client-type",
      res,
      status: STATUS.BAD_REQUEST,
    });
  }

  const { email, password } = req.body;

  try {
    const existingUser = await user.findOne({ email });

    if (!existingUser) {
      return ApiResponse.error({
        message: "User not found",
        res,
        status: STATUS.NOT_FOUND,
      });
    }

    const isPasswwordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswwordValid) {
      return ApiResponse.error({
        message: "Invalid credentials",
        res,
        status: STATUS.UNAUTHORIZED,
      });
    }

    const accessToken = generateAccessToken({
      email: existingUser.email.toString(),
      id: existingUser._id.toString(),
    });

    const refreshToken = generateRefreshToken({
      email: existingUser.email.toString(),
      id: existingUser._id.toString(),
    });

    const hashedRefreshToken = hashtoken(refreshToken);

    const { password: _pwd, ...userWithoutPassword } = existingUser.toObject();

    //store refresh token in session
    await session.create({
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip,
      refreshToken: hashedRefreshToken,
      userAgent: req.get("User-Agent") || "",
      userId: existingUser._id,
    });

    /* detect platform (web vs mobile client) in the login controller — 
   so you can use HttpOnly cookies for web and token-in-response for mobile. */

    if (platform === "web") {
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure: true,
      });

      return ApiResponse.success({
        data: {
          ...userWithoutPassword,
          accessToken,
        },
        message: "Login successful",
        res,
        status: STATUS.OK,
      });
    }

    if (platform === "mobile") {
      return ApiResponse.success({
        data: {
          ...userWithoutPassword,
          accessToken,
          refreshToken,
        },
        message: "Login successful",
        res,
        status: STATUS.OK,
      });
    }
  } catch (error: unknown) {
    // let errMsg: string | object;
    // if (error instanceof Error) {
    //   errMsg = error.message;
    // } else {
    //   errMsg = error || "Unknown error";
    // }

    // return ApiResponse.error({ res, error: errMsg });
    return ApiResponse.error({
      error: error instanceof Error ? error.message : "Unknown error",
      res,
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    const incomingHashedToken = hashtoken(refreshToken);

    if (!incomingHashedToken) {
      return ApiResponse.error({
        message: "Refresh token not provided",
        res,
        status: STATUS.UNAUTHORIZED,
      });
    }

    const existingSession = await session.findOne({
      refreshToken: incomingHashedToken,
    });
    if (!existingSession) {
      return ApiResponse.error({
        message: "Invalid refresh token",
        res,
        status: STATUS.UNAUTHORIZED,
      });
    }

    const userId = existingSession.userId;

    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return ApiResponse.error({
        message: "User not found",
        res,
        status: STATUS.UNAUTHORIZED,
      });
    }
    const newAccessToken = generateAccessToken({
      email: existingUser.email,
      id: existingUser._id.toString(),
    });

    const newRefreshToken = generateRefreshToken({
      email: existingUser.email,
      id: existingUser._id.toString(),
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
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        //secure: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return ApiResponse.success({
      data: {
        accessToken: newAccessToken,
        refreshToken: platform === "mobile" ? newRefreshToken : undefined,
      },
      message: "Token refreshed successfully",
      res,
    });
  } catch (error) {
    let errMsg: string | object;
    if (error instanceof Error) {
      errMsg = error.message;
    } else {
      errMsg = error || "Unknown error";
    }

    return ApiResponse.error({ error: errMsg, res });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const incomingHashedToken = hashtoken(refreshToken);

    if (!incomingHashedToken) {
      return ApiResponse.error({
        message: "Refresh token not provided",
        res,
        status: STATUS.BAD_REQUEST,
      });
    }

    await session.findOneAndDelete({ refreshToken: incomingHashedToken });

    //clear cookie if web client
    const platform = req.headers["x-client-type"];
    if (platform === "web") {
      res.clearCookie("refreshToken");
    }

    return ApiResponse.success({
      message: "Logged out successfully",
      res,
    });
  } catch (error) {
    let errMsg: string | object;
    if (error instanceof Error) {
      errMsg = error.message;
    } else {
      errMsg = error || "Unknown error";
    }

    return ApiResponse.error({ error: errMsg, res });
  }
};

export default {
  login,
  logout,
  refreshToken,
  register,
};
