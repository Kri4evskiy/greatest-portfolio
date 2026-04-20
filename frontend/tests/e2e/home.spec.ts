import { expect, test } from "@playwright/test";

test("loads the bootstrap homepage", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Greatest Portfolio" })).toBeVisible();
  await expect(
    page.getByText("Next.js frontend, Python backend, Supabase foundation."),
  ).toBeVisible();
});
