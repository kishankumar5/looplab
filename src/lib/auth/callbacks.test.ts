import { describe, expect, it, vi } from "vitest";
import { addUserIdToSession, addUserIdToToken, authorizeCredentials } from "./callbacks";

const user = { id: "u1", email: "nick@example.com", displayName: "nick", createdAt: new Date() };

describe("authorizeCredentials", () => {
  it("returns the Auth.js user when the password matches", async () => {
    const verify = vi.fn().mockResolvedValue(user);
    await expect(authorizeCredentials({ email: " NICK@example.com", password: "pw" }, verify)).resolves.toEqual({
      id: "u1",
      email: "nick@example.com",
      name: "nick",
    });
    expect(verify).toHaveBeenCalledWith("nick@example.com", "pw");
  });

  it("returns null when the password doesn't match", async () => {
    const verify = vi.fn().mockResolvedValue(null);
    await expect(authorizeCredentials({ email: "nick@example.com", password: "bad" }, verify)).resolves.toBeNull();
  });

  it("returns null without checking the database when the form is invalid", async () => {
    const verify = vi.fn();
    await expect(authorizeCredentials({ email: "nope" }, verify)).resolves.toBeNull();
    expect(verify).not.toHaveBeenCalled();
  });
});

describe("token and session callbacks", () => {
  it("stores the user id in the token only at sign-in", () => {
    expect(addUserIdToToken({}, { id: "u1" })).toEqual({ userId: "u1" });
    expect(addUserIdToToken({ userId: "u1" })).toEqual({ userId: "u1" });
  });

  it("puts the token's user id on the session", () => {
    expect(addUserIdToSession({ user: { id: "" } }, { userId: "u1" }).user.id).toBe("u1");
    expect(addUserIdToSession({ user: { id: "" } }, {}).user.id).toBe("");
  });
});
