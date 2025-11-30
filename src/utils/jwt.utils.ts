import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { config } from "@/config/config";

export interface TokenPayload {
  id: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
  const options: SignOptions = {
    expiresIn: config.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, config.ACCESS_TOKEN_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload) => {
  const options: SignOptions = {
    expiresIn: config.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, config.REFRESH_TOKEN_SECRET as Secret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.ACCESS_TOKEN_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.REFRESH_TOKEN_SECRET as Secret) as TokenPayload;
};
