import mongoose from "mongoose";
import type { ISession } from "@/types/index.ds";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshToken: { type: String, required: true, default: null },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

const session = mongoose.model<ISession>("Session", sessionSchema);
export default session;
