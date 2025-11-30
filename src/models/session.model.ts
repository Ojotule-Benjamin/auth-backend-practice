import mongoose from "mongoose";
import type { ISession } from "@/types/index.ds";

const sessionSchema = new mongoose.Schema(
  {
    expiresAt: Date,
    ipAddress: { type: String },
    refreshToken: { default: null, required: true, type: String },
    userAgent: { type: String },
    userId: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  },
);

const session = mongoose.model<ISession>("Session", sessionSchema);
export default session;
