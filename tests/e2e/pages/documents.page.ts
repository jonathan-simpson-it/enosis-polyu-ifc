import { type Page, type Locator } from "@playwright/test";

export class DocumentsPage {
  readonly page: Page;
  readonly documentRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.documentRows = page.locator("table tbody tr");
  }

  async goto() {
    await this.page.goto("/documents");
    await this.page.waitForLoadState("networkidle");
  }

  async getRowCount(): Promise<number> {
    return this.documentRows.count();
  }

  async getFilenameInRow(rowIndex: number): Promise<string> {
    const text = (await this.documentRows.nth(rowIndex).textContent()) || "";
    return text.trim();
  }

  async getStatusBadge(rowIndex: number): Promise<string> {
    const badge = this.documentRows.nth(rowIndex).locator('[class*="rounded-full"]');
    const text = await badge.textContent();
    return (text || "").trim().toLowerCase();
  }

  async clickReviewLink(rowIndex: number) {
    const link = this.documentRows.nth(rowIndex).locator("a");
    await link.click();
    await this.page.waitForLoadState("networkidle");
  }

  async deleteDocument(rowIndex: number) {
    const deleteBtn = this.documentRows.nth(rowIndex).getByRole("button", { name: "Delete" });
    await deleteBtn.click();
    const modalConfirm = this.page.locator('[class*="fixed"][class*="inset-0"]').getByRole("button", { name: "Delete" });
    await modalConfirm.waitFor({ state: "visible", timeout: 5000 });
    await modalConfirm.click();
    await this.page.waitForTimeout(2000);
  }
}
