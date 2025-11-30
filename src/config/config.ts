import dotenv from "dotenv";

dotenv.config();

export const config = {
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY ?? "15m",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  API_VERSION: process.env.API_VERSION || "v1",
  DATABASE_URL: process.env.DATABASE_URL || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "2000",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY ?? "7d",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
};

export const API_CONFIG = {
  basePath: "/api",
  version: config.API_VERSION || "v1",
} as const;

export const getApiPath = (path: string) => {
  return `${API_CONFIG.basePath}/${API_CONFIG.version}${path}`;
};
