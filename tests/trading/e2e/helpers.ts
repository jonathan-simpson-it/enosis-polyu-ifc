import { expect, Page } from "@playwright/test";

export function trackConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/favicon|Download the React DevTools/i.test(text)) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

export async function expectNoConsoleErrors(errors: string[]) {
  expect(errors).toEqual([]);
}

export async function expectKatexHealthy(page: Page) {
  expect(await page.locator(".katex").count()).toBeGreaterThan(0);
  await expect(page.locator(".katex-error")).toHaveCount(0);
}