import request from "supertest";
import app from "@/server";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getApiPath } from "@/config/config";
import { STATUS } from "@/constants/statusCodes";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
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
    const res = await request(app).get("/api/v1/features");
    expect(res.statusCode).toEqual(200);
    expect(res.body.features).toBeDefined();
  });

  it("Should register a new user on POST /api/v1/auth/register", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
    });
    expect(res.status).toBe(STATUS.CREATED);
  });
});
