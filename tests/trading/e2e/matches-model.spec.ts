import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, trackConsole } from "./helpers";

test("match explorer scores an arbitrary pair", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge/matches?buyer=zuvo");
  await expect(page.getByRole("heading", { name: "Match explorer" })).toBeVisible();
  await page.locator("select").nth(1).selectOption("88");
  await expect(page.getByRole("button", { name: "Why this?" })).toBeVisible();
  await expect(page.getByText("P(convert)").first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("model page: equations, regression refit, slider rerank", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge/model");
  await expect(page.getByText("The model, written out: every equation the scorer evaluates")).toBeVisible();
  expect(await page.locator(".katex").count()).toBeGreaterThan(5);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ridge regression on weak relevance grades" })).toBeVisible();
  await expect(page.getByText("Fitted equation (weak-label target, grades 0 to 3; score = clip(g / 3, 0, 1))")).toBeVisible();

  await page.getByRole("button", { name: /Refit regression|Fit regression/ }).click();
  await expect(page.getByRole("button", { name: "Refit regression" })).toBeVisible({ timeout: 30_000 });

  const slider = page.locator('input[type="range"]').first();
  await slider.evaluate((node) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    setter.call(node, "0.8");
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.getByText("Live rank preview")).toBeVisible();
  await expectNoConsoleErrors(errors);
});