import { test, expect } from "@playwright/test";
import { UploadPage } from "./pages/upload.page";
import path from "path";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");
const invoicePath = path.join(FIXTURES_DIR, "invoice-sample.txt");
const csvPath = path.join(FIXTURES_DIR, "packing-list.csv");

test.describe("Document Upload", () => {
  let uploadPage: UploadPage;

  test.beforeEach(async ({ page }) => {
    uploadPage = new UploadPage(page);
  });

  test("upload a text invoice file and see success", async ({ page }) => {
    test.slow();
    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    const result = await uploadPage.waitForUploadResult();
    expect(result).toContain("Upload Successful");
    expect(result).toContain("invoice-sample");
  });

  test("upload a CSV packing list and see success", async ({ page }) => {
    test.slow();
    await uploadPage.goto();
    await uploadPage.uploadFile(csvPath);
    const result = await uploadPage.waitForUploadResult();
    expect(result).toContain("Upload Successful");
    expect(result).toContain("packing-list");
  });

  test("review button appears after upload", async ({ page }) => {
    test.slow();
    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    await uploadPage.waitForUploadResult();
    await expect(
      page.getByRole("button", { name: /review.*process/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("navigate to review page after upload", async ({ page }) => {
    test.slow();
    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    await uploadPage.waitForUploadResult();
    await uploadPage.clickReviewButton();
    await page.waitForURL(/review/, { timeout: 10000 });
    expect(page.url()).toContain("/review");
  });
});
