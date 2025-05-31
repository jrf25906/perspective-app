import request from "supertest";
import { createTestApp } from "../src/app";

describe("GET /challenge/today", () => {
  const app = createTestApp();
  
  it("should return today's challenge", async () => {
    const res = await request(app).get("/challenge/today");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("prompt");
    expect(res.body).toHaveProperty("options");
  });
});
