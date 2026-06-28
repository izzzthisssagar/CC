import { test, expect } from "@playwright/test";

// Smoke tests — verify each route loads + core content renders.
// Clean replacements for the buggy senior-qa scaffolder output
// (which emitted invalid `toHaveURL(///)` for the root route).

test.describe("landing", () => {
  test("loads and shows the hero + upload CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nepali AI Caption/);
    await expect(page.getByRole("link", { name: /upload video/i })).toBeVisible();
  });
});

test.describe("upload", () => {
  test("shows the dropzone", async ({ page }) => {
    await page.goto("/upload");
    await expect(page.getByText(/choose a video/i)).toBeVisible();
  });
});

test.describe("editor", () => {
  test("renders preview + style picker with stub transcript", async ({ page }) => {
    await page.goto("/editor/demo");
    await expect(page.getByText(/Editor · demo/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Export MP4/i })).toBeVisible();
    // Devanagari + Latin words both rendered (Ninglish line).
    await expect(page.getByText("नमस्ते")).toBeVisible();
    await expect(page.getByText("video")).toBeVisible();
  });
});
