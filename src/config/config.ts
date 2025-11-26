import dotenv from "dotenv";
dotenv.config();

export const config = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET! as string,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY ?? "15m",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET! as string,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY ?? "7d",
  DATABASE_URL: process.env.DATABASE_URL || "",
  PORT: process.env.PORT || "2000",
  API_VERSION: process.env.API_VERSION || "v1",
  NODE_ENV: process.env.NODE_ENV || "development",
};

export const API_CONFIG = {
  version: config.API_VERSION || "v1",
  basePath: "/api",
} as const;

export const getApiPath = (path: string) => {
  return `${API_CONFIG.basePath}/${API_CONFIG.version}${path}`;
};
