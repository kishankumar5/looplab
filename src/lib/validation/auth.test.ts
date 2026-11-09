import { describe, expect, it } from "vitest";
import { registerSchema, signInSchema } from "./auth";

const valid = { email: "Nick@Example.com ", displayName: " nick ", password: "hunter222" };

describe("registerSchema", () => {
  it("accepts a valid registration and normalizes email and name", () => {
    expect(registerSchema.parse(valid)).toEqual({
      email: "nick@example.com",
      displayName: "nick",
      password: "hunter222",
    });
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["email"]);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Password must be at least 8 characters");
  });

  it("rejects an empty or too-long display name", () => {
    expect(registerSchema.safeParse({ ...valid, displayName: "   " }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, displayName: "x".repeat(41) }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires an email and a non-empty password", () => {
    expect(signInSchema.safeParse({ email: "nick@example.com", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(signInSchema.parse({ email: " NICK@example.com", password: "x" }).email).toBe("nick@example.com");
  });
});
