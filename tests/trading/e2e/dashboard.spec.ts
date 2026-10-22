import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, trackConsole } from "./helpers";

test("dashboard renders stats, pipeline status and entry points", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge");
  await expect(page.getByRole("heading", { name: "Recommendation engine overview" })).toBeVisible();
  await expect(page.getByText("6,500")).toBeVisible();
  await expect(page.getByText("65", { exact: false }).first()).toBeVisible();
  await expect(page.getByText(/vision: \d+ pairs with CLIP/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Start the explainability tour" })).toBeVisible();
  await expect(page.getByText("Data honesty")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("buyers and products lists render", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge/buyers");
  await expect(page.getByRole("heading", { name: "Buyers" })).toBeVisible();
  await expect(page.getByText("Zuvo").first()).toBeVisible();
  await page.goto("/deepbridge/products");
  await expect(page.getByRole("heading", { name: "Supplier products" })).toBeVisible();
  await expect(page.getByText("Silicone Mat", { exact: false }).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});