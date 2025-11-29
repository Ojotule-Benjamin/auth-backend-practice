import request from "supertest";
import app from "@/server";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { STATUS } from "@/constants/statusCodes";
import user from "@/models/user.model";
import { getApiPath } from "@/config/config";
import bcrypt from "bcryptjs";
import session from "@/models/session.model";
import { hashtoken } from "@/controllers/auth.controller";

type testUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
};

let mongo: MongoMemoryServer;
let testUser: testUser;
let refreshToken: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  const hashedPassword = await bcrypt.hash("Password123@", 10);

  let testUser = await user.create({
    firstName: "John",
    lastName: "Doe",
    email: "john@gmail.com",
    password: hashedPassword,
    phoneNumber: "07065453423",
  });

  refreshToken = "test-refresh-token";

  await session.create({
    userId: testUser._id,
    refreshToken: hashtoken(refreshToken),
    userAgent: "jest-test",
    ipAddress: "127.0.0.1",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
});

afterAll(async () => {
  await user.deleteMany({});
  await session.deleteMany({});
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Auth API Endpoints - Refresh Token, and Logout Functionality", () => {
  it("should login the user for mobile and return tokens", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/login")}`)
      .set("x-client-type", "mobile")
      .send({
        email: "john@gmail.com",
        password: "Password123@",
      });
    expect(res.status).toBe(STATUS.OK);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    refreshToken = res.body.data.refreshToken;
  });

  it("should refresh tokens successfully on mobile", async () => {
    const res = await request(app)
      .post(getApiPath("/auth/refresh-token"))
      .set("x-client-type", "mobile")
      .send({ refreshToken });

    expect(res.status).toBe(STATUS.OK);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("should refresh tokens successfully", async () => {
    const res = await request(app)
      .post(getApiPath("/auth/refresh-token"))
      .set("x-client-type", "web")
      .send({ refreshToken });

    expect(res.status).toBe(STATUS.OK);
    expect(res.body.data.accessToken).toBeDefined();

    const cookie: string[] | undefined = res.get("Set-Cookie");
    expect(cookie).toBeDefined();
    expect(cookie![0]).toMatch(/refreshToken=/);
    expect(cookie![0]).toMatch(/HttpOnly/);
  });

  it("should logout the user successfully", async () => {
    const res = await request(app)
      .post(getApiPath("/auth/logout"))
      .send({ refreshToken });

    expect(res.status).toBe(STATUS.OK);
    expect(res.body.message).toBe("Logged out successfully");
  });

  it("should return 400 on logout if token missing", async () => {
    const res = await request(app).post(getApiPath("/auth/logout")).send({});

    expect(res.status).toBe(STATUS.BAD_REQUEST);
  });
});
