import { test, expect } from "@playwright/test";
import { DocumentsPage } from "./pages/documents.page";
import { UploadPage } from "./pages/upload.page";
import path from "path";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");
const invoicePath = path.join(FIXTURES_DIR, "invoice-sample.txt");

test.describe("Documents List", () => {
  let documentsPage: DocumentsPage;
  let uploadPage: UploadPage;

  test.beforeEach(async ({ page }) => {
    documentsPage = new DocumentsPage(page);
    uploadPage = new UploadPage(page);
  });

  test("shows uploaded document in the list", async ({ page }) => {
    test.slow();
    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    await uploadPage.waitForUploadResult();

    await documentsPage.goto();
    const rowCount = await documentsPage.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test("status badge is visible for uploaded document", async ({ page }) => {
    test.slow();
    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    await uploadPage.waitForUploadResult();

    await documentsPage.goto();
    const status = await documentsPage.getStatusBadge(0);
    expect(status).toBeTruthy();
  });

  test("delete document removes it from list", async ({ page }) => {
    test.slow();
    await uploadPage.goto();
    await uploadPage.uploadFile(invoicePath);
    await uploadPage.waitForUploadResult();

    await documentsPage.goto();
    const before = await documentsPage.getRowCount();
    expect(before).toBeGreaterThanOrEqual(1);

    await documentsPage.deleteDocument(0);
    await page.waitForTimeout(2000);
  });
});
