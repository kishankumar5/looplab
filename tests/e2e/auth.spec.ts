import { expect, test } from "@playwright/test";

// US-1 main flow: register, sign out, wrong password, sign back in.
test("register, sign out, and sign back in", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "hunter222";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Display name").fill("e2e tester");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Signed in as")).toContainText("e2e tester");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.goto("/signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong email or password.")).toBeVisible();

  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Signed in as")).toContainText("e2e tester");
});

test("registering an email that already exists shows a message", async ({ page, request }) => {
  const email = `e2e-dup-${Date.now()}@example.com`;
  await request.post("/api/auth/register", { data: { email, displayName: "first", password: "hunter222" } });

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Display name").fill("second");
  await page.getByLabel("Password").fill("hunter222");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("An account with this email already exists.")).toBeVisible();
});
