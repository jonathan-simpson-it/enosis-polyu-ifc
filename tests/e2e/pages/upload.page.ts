import { type Page, type Locator } from "@playwright/test";

export class UploadPage {
  readonly page: Page;
  readonly fileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fileInput = page.locator('input[type="file"]');
  }

  async goto() {
    await this.page.goto("/upload");
    await this.page.waitForLoadState("networkidle");
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async waitForUploadResult(): Promise<string> {
    const heading = this.page.getByText("Upload Successful");
    await heading.waitFor({ timeout: 20000 });
    const text = await this.page.locator("body").textContent();
    return text || "";
  }

  async clickReviewButton() {
    await this.page.getByRole("button", { name: /review.*process/i }).click();
    await this.page.waitForLoadState("networkidle");
  }
}
