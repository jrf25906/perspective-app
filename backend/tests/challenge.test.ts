import request from "supertest";
import app from "../src/server"; // adjust import to your Express app

describe("GET /challenge/today", () => {
  it("should return today's challenge", async () => {
    const res = await request(app).get("/challenge/today");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("prompt");
    expect(res.body).toHaveProperty("options");
  });
});
