import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, trackConsole } from "./helpers";

test("buyer detail: ten explained recommendations, evidence, feedback", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge/buyers/zuvo");
  await expect(page.getByText("Their catalog: the revealed-preference signal")).toBeVisible();

  const cards = page.getByRole("button", { name: "Why this?" });
  await expect(cards).toHaveCount(10);
  await cards.first().click();

  await expect(page.getByText("Score decomposition: exact contribution waterfall (weight x value)")).toBeVisible();
  await expect(page.getByText("Matched evidence from buyer catalog")).toBeVisible();
  await expect(page.getByText("Commercial reasoning")).toBeVisible();
  await expect(page.getByText("Constraints & policy")).toBeVisible();
  await expect(page.getByText("requires cost data")).toBeVisible();

  await page.getByRole("button", { name: "Send to buyer" }).first().click();
  await expect(page.getByRole("button", { name: /Send to buyer · logged/ })).toBeVisible();

  await expect(page.getByText("Why NOT this?")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("product detail: ranked buyers with the same components", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge/products/88");
  await expect(page.getByRole("heading", { name: /Silicone Mat Pet Anti-Slip/ })).toBeVisible();
  await expect(page.getByText("Ranked buyers for this product, same explanation components")).toBeVisible();
  await expect(page.getByRole("button", { name: "Why this?" }).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});