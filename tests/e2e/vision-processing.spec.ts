import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");
const imagePath = path.join(FIXTURES_DIR, "invoice-sample.jpg");

// Regression guard: image uploads used to hang forever because the tesseract
// OCR worker never booted on serverless runtimes and the client had no
// timeout. OCR is removed; images route through the vision model with a 55s
// abort and a 58s server race, so a response must always arrive quickly.
test.describe("Vision / image processing", () => {
  test("POST /api/documents/process resolves for an image (no hang)", async ({
    request,
  }) => {
    test.setTimeout(90000);

    const start = Date.now();
    const res = await request.post("/api/documents/process", {
      // Server races at 58s, so the client request timeout must exceed it.
      timeout: 70000,
      multipart: {
        file: {
          name: "invoice-sample.jpg",
          mimeType: "image/jpeg",
          buffer: fs.readFileSync(imagePath),
        },
      },
    });
    const elapsed = Date.now() - start;

    expect(elapsed, `took ${elapsed}ms`).toBeLessThan(60000);
    // 200 = extraction (possibly partial); 422 = vision failed and nothing
    // was extracted; 504 = the route race fired.
    expect([200, 422, 504]).toContain(res.status());

    const body = await res.json();
    if (res.status() === 200) {
      expect(body.extraction).toBeTruthy();
      expect(body.extraction.status).toBe("extracted");
      expect(body.parsed).toBeTruthy();
      expect(["ok", "failed", "timed_out", "skipped"]).toContain(
        body.vision?.status
      );
    } else {
      expect(body.detail).toBeTruthy();
    }
  });

  test("demo page live upload resolves instead of spinning forever", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await page.goto("/demo");
    await page.locator("#live-file-input").setInputFiles(imagePath);

    const processBtn = page.getByRole("button", { name: /process live/i });
    await expect(processBtn).toBeVisible();
    await processBtn.click();

    // Either the extraction renders (Verification API section) or the engine
    // surfaces a friendly error — never a perpetual spinner.
    const resolved = page
      .getByText("Verification API")
      .or(page.getByText("Live engine error"));
    await expect(resolved).toBeVisible({ timeout: 100000 });

    const spinner = page.getByRole("heading", { name: "Enosis Engine" });
    await expect(spinner).not.toBeVisible();
  });
});
