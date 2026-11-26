import { expect, test, type Download } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { projects } from "../src/data";

test("ค้นหาแท็กทุกตัวและใช้คีย์บอร์ดกรองโปรเจกต์", async ({ page, colorScheme }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme!);
  const tags = new Set(projects.flatMap(project => project.tags));
  for (const tag of ["ONNX Runtime", "Amazon Bedrock"]) {
    await page.getByRole("button", { name: /Search and quick actions/ }).press("Control+k");
    const search = page.getByRole("combobox", { name: "Search commands" });
    await search.fill("Filter projects by ");
    await expect(page.getByRole("option")).toHaveCount(tags.size);
    await search.fill(tag);
    const option = page.getByRole("option", { name: `Filter projects by ${tag}`, exact: false });
    await expect(option).toBeVisible();
    await expect(search).toHaveAttribute("aria-activedescendant", /^\S+$/);
    expect(await search.getAttribute("aria-activedescendant")).toBe(await option.getAttribute("id"));
    await search.press("Enter");
    await expect(page.getByRole("group", { name: "Filter projects by technology" }).getByRole("button", { name: tag })).toHaveAttribute("aria-pressed", "true");
    for (const project of projects.filter(project => project.tags.includes(tag))) {
      await expect(page.locator(`#evidence-${project.id}`)).toBeVisible();
    }
  }
});

test("Tab ไปตามตัวกรองแล้วเห็นปุ่มและวงโฟกัสเต็มปุ่ม", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Technology", exact: true }).click();
  for (const name of ["category", "technology"]) {
    const row = page.getByRole("group", { name: `Filter projects by ${name}` });
    const buttons = await row.getByRole("button").all();
    await buttons[1].press("Shift+Tab");
    for (const [i, button] of buttons.entries()) {
      if (i) await page.keyboard.press("Tab");
      await expect(button).toBeFocused();
      const bounds = await row.boundingBox();
      const chip = await button.boundingBox();
      if (page.viewportSize()!.width === 320) {
        await expect(row).toHaveCSS("mask-image", "none");
        expect(chip!.x - bounds!.x).toBeGreaterThanOrEqual(3);
        expect(bounds!.x + bounds!.width - chip!.x - chip!.width).toBeGreaterThanOrEqual(3);
      }
    }
  }
});

test("Escape คืนโฟกัสให้การ์ดที่เปิดหน้าโปรเจกต์", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("link", { name: "Explore KaTang Cash-flow Co-pilot", exact: true });
  await card.focus();
  await card.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(dialog.locator("header").getByRole("link", { name: /Demo with sample budgets/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
});

async function verifyCV(download: Download) {
  const name = "Kulachart-Parnduangkeaw-CV.pdf";
  expect(download.suggestedFilename()).toBe(name);
  const actual = await readFile(await download.path());
  expect(actual.equals(await readFile(`src/assets/${name}`))).toBe(true);
}

test("ดาวน์โหลด CV จาก Command Palette", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Search and quick actions/ }).click();
  const search = page.getByRole("combobox", { name: "Search commands" });
  await search.fill("resume");
  const download = page.waitForEvent("download");
  await search.press("Enter");
  await verifyCV(await download);
});

test.describe("เมื่อปิด JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("อ่านสรุปจากลิงก์โปรเจกต์ตรงและดาวน์โหลด CV ได้", async ({ page }) => {
    const project = projects[0];
    await page.goto(`/projects/${project.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
    await expect(page.getByText(project.desc, { exact: true })).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download CV (PDF)" }).click();
    await verifyCV(await download);
  });
});
