import { type Page, type Locator } from "@playwright/test";

export class ReviewPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(declarationId: string) {
    await this.page.goto(`/documents/${declarationId}/review`);
    await this.page.waitForLoadState("networkidle");
  }

  async runExtraction() {
    const btn = this.page.getByRole("button", { name: /run extraction/i });
    await btn.waitFor({ state: "visible", timeout: 15000 });
    await btn.click();
  }

  async waitForExtractionComplete() {
    await this.page.getByText(/commodity items/i).waitFor({ timeout: 60000 });
    await this.page.waitForLoadState("networkidle");
  }

  getStatusText(): Promise<string> {
    return this.page
      .locator('[class*="rounded-full"]')
      .first()
      .textContent()
      .then((t) => (t || "").trim().toLowerCase());
  }

  async editHeaderField(label: string, value: string) {
    const dt = this.page.locator("dt", { hasText: label });
    const parent = dt.locator("..");
    const input = parent.locator("input");
    if (await input.isVisible()) {
      await input.clear();
      await input.fill(value);
    }
  }

  async saveHeader() {
    const section = this.page.getByText("Declaration Info").locator("..");
    const btn = section.locator("..").getByRole("button", { name: /save/i });
    if (await btn.isVisible()) {
      await btn.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  async editCommodityField(fieldLabel: string, rowIndex: number, value: string) {
    const th = this.page.locator("thead th").filter({ hasText: new RegExp(fieldLabel, "i") });
    const colIndex = await th.evaluate((el) => {
      const cells = Array.from(el.closest("tr")!.children);
      return cells.indexOf(el);
    });
    const input = this.page.locator("tbody tr").nth(rowIndex).locator("td").nth(colIndex).locator("input");
    if (await input.isVisible()) {
      await input.clear();
      await input.fill(value);
    }
  }

  async saveCommodities() {
    const btn = this.page.getByRole("button", { name: /save changes/i });
    if (await btn.isVisible()) {
      await btn.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  async approve() {
    const btn = this.page.getByRole("button", { name: /approve.*reviewed/i });
    await btn.waitFor({ state: "visible", timeout: 10000 });
    await btn.click();
    await this.page.waitForLoadState("networkidle");
  }

  async selectExportFormat(format: string) {
    await this.page.locator("select").selectOption(format);
  }

  async exportDocument() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download", { timeout: 15000 }),
      this.page.getByRole("button", { name: /export/i }).click(),
    ]);
    return download;
  }

  async submitToTsw() {
    const btn = this.page.getByRole("button", { name: /submit to tsw/i });
    if (await btn.isVisible()) {
      await btn.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  async getCommodityRowCount(): Promise<number> {
    return this.page.locator("tbody tr").count();
  }

  async bodyText(): Promise<string> {
    return (await this.page.locator("body").textContent()) || "";
  }
}
