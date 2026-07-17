import { test, expect } from "@playwright/test";
import { UploadPage } from "./pages/upload.page";
import { ReviewPage } from "./pages/review.page";
import path from "path";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");
const invoicePath = path.join(FIXTURES_DIR, "invoice-sample.txt");

test.describe("Document Processing Pipeline", () => {
  let uploadPage: UploadPage;
  let reviewPage: ReviewPage;

  test.beforeEach(async ({ page }) => {
    uploadPage = new UploadPage(page);
    reviewPage = new ReviewPage(page);
  });

  test("full pipeline: upload → extract → verify → approve → export → submit", async ({
    page,
  }) => {
    test.slow();
    test.setTimeout(180000);

    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    await uploadPage.waitForUploadResult();
    await uploadPage.clickReviewButton();
    await page.waitForLoadState("networkidle");

    const statusBefore = await reviewPage.getStatusText();
    expect(statusBefore).toMatch(/uploaded|processing/);

    await reviewPage.runExtraction();
    await reviewPage.waitForExtractionComplete();
    const statusAfterExtract = await reviewPage.getStatusText();
    expect(statusAfterExtract).toContain("extracted");

    await expect(page.locator('input[value*="8471.30"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[value*="8523.51"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[value*="8542.31"]')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Confidence Scores")).toBeVisible();
    await expect(page.getByText("Commodities (3)")).toBeVisible();

    await reviewPage.approve();
    await page.getByText(/approved/i).waitFor({ timeout: 10000 });
    const statusAfterApprove = await reviewPage.getStatusText();
    expect(statusAfterApprove).toContain("reviewed");

    const download = await reviewPage.exportDocument();
    expect(download).toBeTruthy();
    const dlPath = await download.path();
    expect(dlPath).toBeTruthy();

    await reviewPage.submitToTsw();
    await page.waitForTimeout(2000);
    const statusAfterSubmit = await reviewPage.getStatusText();
    expect(statusAfterSubmit).toContain("submitted");

    const finalText = await reviewPage.bodyText();
    expect(finalText).toContain("Submitted to Mock TSW");
    expect(finalText).toMatch(/MOCK-TSW|tsw_reference/i);
  });

  test("commodity rows appear after extraction", async ({ page }) => {
    test.slow();
    test.setTimeout(120000);

    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    await uploadPage.waitForUploadResult();
    await uploadPage.clickReviewButton();

    await reviewPage.runExtraction();
    await reviewPage.waitForExtractionComplete();

    const rowCount = await reviewPage.getCommodityRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(3);
  });

  test("status transitions correctly: processing → extracted → reviewed → submitted", async ({
    page,
  }) => {
    test.slow();
    test.setTimeout(120000);

    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    await uploadPage.waitForUploadResult();
    await uploadPage.clickReviewButton();

    let status = await reviewPage.getStatusText();
    expect(status).toMatch(/uploaded|processing/);

    await reviewPage.runExtraction();
    await reviewPage.waitForExtractionComplete();
    status = await reviewPage.getStatusText();
    expect(status).toContain("extracted");

    await reviewPage.approve();
    await page.getByText(/approved/i).waitFor({ timeout: 10000 });
    status = await reviewPage.getStatusText();
    expect(status).toContain("reviewed");

    await reviewPage.submitToTsw();
    await page.waitForTimeout(2000);
    status = await reviewPage.getStatusText();
    expect(status).toContain("submitted");
  });
});
