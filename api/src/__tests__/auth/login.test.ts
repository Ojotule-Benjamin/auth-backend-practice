import request from "supertest";
import app from "@/server";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { STATUS } from "@/constants/statusCodes";
import user from "@/models/user.model";
import { getApiPath } from "@/config/config";
import bcrypt from "bcryptjs";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  const hashedPassword = await bcrypt.hash(process.env.LOGIN_TEST_SECRET!, 10);
  await user.create({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: hashedPassword,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Auth API - Login", () => {
  it("should fail if x-client-type header is missing", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/login")}`)
      .send({
        email: "john@example.com",
        password: process.env.LOGIN_TEST_SECRET!,
      });
    expect(res.status).toBe(STATUS.BAD_REQUEST);
  });

  it("should fail if an invalid x-client-type header is provided", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/login")}`)
      .set("x-client-type", "entropy")
      .send({
        email: "john@example.com",
        password: process.env.LOGIN_TEST_SECRET!,
      });
    expect(res.status).toBe(STATUS.BAD_REQUEST);
  });

  it("should fail if email does not exist", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/login")}`)
      .set("x-client-type", "mobile")
      .send({
        email: "john.doe12@gmail.com",
        password: "_John_Doe",
      });
    expect(res.status).toBe(STATUS.NOT_FOUND);
    expect(res.body.message).toBe("User not found");
  });
  it("should fail validation for invalid email format", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("x-client-type", "mobile")
      .send({
        email: "invalid-email",
        password: process.env.LOGIN_TEST_SECRET!,
      });

    expect(res.status).toBe(STATUS.BAD_REQUEST);
    expect(res.body.message).toMatch(/Valid email is required/);
  });

  it("should fail validation for empty password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("x-client-type", "mobile")
      .send({
        email: "john@example.com",
        password: "",
      });

    expect(res.status).toBe(STATUS.BAD_REQUEST);
    expect(res.body.message).toMatch(/Password is required/);
  });

  it("should fail if password is wrong", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/login")}`)
      .set("x-client-type", "mobile")
      .send({
        email: "john@example.com",
        password: "_Same_Doee",
      });
    expect(res.status).toBe(STATUS.UNAUTHORIZED);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should login the user and return access & refresh tokens for mobile", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/login")}`)
      .set("x-client-type", "mobile")
      .send({
        email: "john@example.com",
        password: process.env.LOGIN_TEST_SECRET!,
      });
    expect(res.status).toBe(STATUS.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("should login the user and return access & refresh tokens for mobile", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/login")}`)
      .set("x-client-type", "mobile")
      .send({
        email: "john@example.com",
        password: process.env.LOGIN_TEST_SECRET!,
      });
    expect(res.status).toBe(STATUS.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // No cookies for mobile
    const cookie = res.get("Set-Cookie");
    expect(cookie).toBeUndefined();
  });

  it("should login the user and set refresh token cookie for web", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/login")}`)
      .set("x-client-type", "web")
      .send({
        email: "john@example.com",
        password: process.env.LOGIN_TEST_SECRET!,
      });
    expect(res.status).toBe(STATUS.OK);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();

    // No cookies for mobile
    const cookie: string[] | undefined = res.get("Set-Cookie");

    expect(cookie).toBeDefined();
    expect(cookie![0]).toMatch(/refreshToken=/);
    expect(cookie![0]).toMatch(/HttpOnly/);
  });
});
