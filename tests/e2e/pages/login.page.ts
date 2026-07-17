import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly orgNameInput: Locator;
  readonly fullNameInput: Locator;
  readonly submitButton: Locator;
  readonly toggleButton: Locator;
  readonly errorText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("you@company.com");
    this.passwordInput = page.getByPlaceholder("Enter your password");
    this.orgNameInput = page.getByPlaceholder("Your Company Ltd.");
    this.fullNameInput = page.getByPlaceholder("Jane Lau");
    this.submitButton = page.locator('button[type="submit"]');
    this.toggleButton = page.getByText(/Don't have an account|Already have/i);
    this.errorText = page.locator("p").filter({ hasText: /failed|invalid|error/i }).first();
  }

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async isSignInForm(): Promise<boolean> {
    const heading = this.page.getByRole("heading", { name: /sign in/i });
    return heading.isVisible({ timeout: 500 }).then(() => true).catch(() => false);
  }

  async register(
    email: string,
    password: string,
    orgName: string,
    fullName: string
  ) {
    if (await this.isSignInForm()) {
      await this.toggleButton.click();
      await this.page.waitForTimeout(300);
    }
    await this.emailInput.waitFor({ state: "visible" });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.orgNameInput.waitFor({ state: "visible", timeout: 5000 });
    await this.orgNameInput.fill(orgName);
    await this.fullNameInput.fill(fullName);
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.emailInput.waitFor({ state: "visible" });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
