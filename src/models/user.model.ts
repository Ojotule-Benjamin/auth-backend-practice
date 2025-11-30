import mongoose from "mongoose";
import type { IUser } from "@/types/index.ds";

const userSchema = new mongoose.Schema<IUser>(
  {
    age: {
      type: Date,
    },
    country: {
      type: String,
    },
    email: {
      required: true,
      type: String,
      unique: true,
    },
    firstName: {
      required: true,
      type: String,
    },
    isVerified: {
      default: false,
      type: Boolean,
    },
    lastName: {
      required: true,
      type: String,
    },
    middleName: {
      type: String,
    },
    password: {
      required: true,
      type: String,
    },

    phoneNumber: {
      type: String,
      unique: true,
    },
    role: {
      default: "user",
      enum: ["user", "admin"],
      type: String,
    },
    state: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const user = mongoose.model<IUser>("User", userSchema);
export default user;
