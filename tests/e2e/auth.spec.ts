import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { uniqueEmail, registerUser } from "./helpers/api";

test.describe("Authentication", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test("register a new account and land on dashboard", async ({ page }) => {
    const email = uniqueEmail();
    const password = "Test1234!";

    await loginPage.goto();
    await loginPage.register(email, password, "E2E Test Org", "E2E Tester");

    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("login with existing credentials", async ({ page }) => {
    const email = uniqueEmail();
    const password = "Test1234!";
    await registerUser(email, password);

    await loginPage.goto();
    await loginPage.login(email, password);

    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("redirect to login when accessing protected route unauthenticated", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto("/upload");
    await page.waitForLoadState("networkidle");
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");

    await context.close();
  });

  test("show error for invalid credentials", async ({ page }) => {
    await loginPage.goto();
    await loginPage.login("nonexistent@enosis.test", "wrongpassword");
    await page.waitForTimeout(3000);
    const heading = page.getByRole("heading", { name: /sign in/i });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });
});
