import request from "supertest";
import app from "@/server";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { STATUS } from "@/constants/statusCodes";
import user from "@/models/user.model";
import { getApiPath } from "@/config/config";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

beforeEach(async () => {
  // Clear database between tests to avoid cross-test pollution
  const collections = Object.keys(mongoose.connection.collections);
  for (const collection of collections) {
    await mongoose.connection.collections[collection].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Auth API", () => {
  it("Should return 404 on unknown route", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.statusCode).toEqual(404);
  });

  it("Should return features on GET /api/v1/features", async () => {
    const res = await request(app).get(`${getApiPath("/features")}`);
    expect(res.status).toEqual(200);
    expect(res.body.features).toBeDefined();
  });

  it("should fail when firstName is missing", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/register")}`)

      .send({
        lastName: "Doe",
        middleName: "Asake",
        email: "john@example.com",
        password: "Password123@",
      });
    expect(res.status).toEqual(STATUS.BAD_REQUEST);
  });

  it("should fail when lastName is missing", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/register")}`)
      .send({
        firstName: "Doe",
        middleName: "Asake",
        email: "john@example.com",
        password: "Password123@",
      });
    expect(res.status).toEqual(STATUS.BAD_REQUEST);
  });

  it("should fail when Email is missing", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/register")}`)
      .send({
        firstName: "Doe",
        lastName: "Doe",
        middleName: "Asake",
        password: "Password123@",
        phoneNumber: "07062568765",
      });
    expect(res.status).toEqual(STATUS.BAD_REQUEST);
  });

  it("should fail when Password is missing", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/register")}`)
      .send({
        firstName: "Doe",
        middleName: "Asake",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "07062568765",
      });
    expect(res.status).toEqual(STATUS.BAD_REQUEST);
  });

  it("should fail when PhoneNumber is missing", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/register")}`)
      .send({
        firstName: "Doe",
        middleName: "Asake",
        lastName: "Doe",
        email: "john@example.com",
        password: "Password123@",
      });
    expect(res.status).toEqual(STATUS.BAD_REQUEST);
  });

  it("Should not allow duplicate email", async () => {
    await user.create({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password123@",
      phoneNumber: "07062568765",
    });

    const res = await request(app)
      .post(`${getApiPath("/auth/register")}`)
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "Password123@",
        phoneNumber: "07062568765",
      });

    expect(res.status).toBe(STATUS.CONFLICT);
    expect(res.body.message).toBe("User already exists");
  });

  it("Should register a new user on POST /api/v1/auth/register", async () => {
    const res = await request(app)
      .post(`${getApiPath("/auth/register")}`)
      .send({
        firstName: "John",
        lastName: "Doe",
        middleName: "Asake",
        email: "john@example.com",
        password: "Password123@",
        phoneNumber: "07062568765",
        country: "Nigeria",
        age: new Date(),
        state: "Kogi",
        role: "user",
        isVerified: false,
      });
    expect(res.status).toBe(STATUS.CREATED);
  });
});
