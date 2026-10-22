import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, trackConsole } from "./helpers";

test("evaluation page: ablation table with ridge row", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge/evaluation");
  await expect(page.getByRole("heading", { name: "Offline evaluation & ablations" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("full + MMR + caps (batch)")).toBeVisible();
  await expect(page.getByText("ridge regression (fitted, weak labels)")).toBeVisible();
  await expect(page.getByText("no real conversion labels")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("settings: save triggers a global re-score", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge/settings");
  await expect(page.getByText("Feature block weights")).toBeVisible();
  await page.getByRole("button", { name: "Save & re-score all buyers" }).click();
  await expect(page.getByText(/Saved & re-scored 65 buyers/)).toBeVisible({ timeout: 30_000 });
  await expectNoConsoleErrors(errors);
});

test("tour: twelve steps of live explanation with math", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/deepbridge/tour");
  await expect(page.getByText("Step 1 / 12")).toBeVisible();
  for (let i = 0; i < 11; i++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(page.getByText("Step 12 / 12")).toBeVisible();
  expect(await page.locator(".katex").count()).toBeGreaterThan(0);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByText("Step 11 / 12")).toBeVisible();
  await expectNoConsoleErrors(errors);
});