import { test as setup } from "@playwright/test";
import { registerUser, uniqueEmail } from "./helpers/api";
import path from "path";

const AUTH_FILE = path.resolve(__dirname, ".auth/user.json");

setup("authenticate as test user", async ({ page }) => {
  const email = uniqueEmail();
  const password = "Test1234!";
  const user = await registerUser(email, password);

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.context().storageState({ path: AUTH_FILE });

  process.env.E2E_TEST_EMAIL = email;
  process.env.E2E_TEST_PASSWORD = password;
  process.env.E2E_TEST_TOKEN = user.token;
  process.env.E2E_TEST_USER_ID = user.userId;
  process.env.E2E_TEST_ORG_ID = user.orgId;
});
