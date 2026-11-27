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

test("แสดงชื่อโครงการและส่ง CV ได้เมื่อไฟล์ JavaScript หลักโหลดไม่สำเร็จ", async ({ page }) => {
  await page.route("**/assets/index-*.js", (route) => route.abort());
  await page.goto("/projects/katang");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(projects[0].title);
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download CV (PDF)" }).click();
  await verifyCV(await download);
});

test("ลิงก์โครงการตรงปิดกลับมาที่ Projects และดาวน์โหลด CV จาก Hero ได้", async ({ page }) => {
  await page.goto("/projects/katang");
  await expect(page.getByRole("dialog").getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/projects\/katang$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/projects\/katang\/preview\.jpg$/);
  await expect(page.locator("#site-fallback")).toHaveCount(0);
  await expect(page.locator("#top")).toHaveCount(0);
  await page.getByRole("button", { name: "All projects" }).click();
  await expect(page.locator("#projects-heading")).toBeFocused();
  const download = page.waitForEvent("download");
  await page.locator("#top a[download]").click();
  await verifyCV(await download);
});

test("เปิด Palette บน Lightbox แล้วนำทางไป Contact ได้และล็อกตำแหน่งพื้นหลัง", async ({ page }) => {
  await page.goto("/#experience");
  const photo = page.locator("#experience").getByRole("button", { name: /View larger/ }).first();
  await photo.click();
  const viewer = page.getByRole("dialog", { name: "Photo viewer" });
  await expect(viewer).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Search commands" });
  await search.fill("Contact");
  await search.press("Enter");
  await expect(viewer).toBeHidden();
  await expect(page.locator("#contact-heading")).toBeFocused();
  await expect(page.locator("html")).not.toHaveCSS("overflow-y", "hidden");
});

test("Back ปิด Palette บน Explore แล้วคืน focus ให้การ์ด", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("link", { name: "Explore KaTang Cash-flow Co-pilot", exact: true });
  await card.focus();
  await card.press("Enter");
  await expect(page.locator("#project-page-title")).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Command menu" })).toBeVisible();
  await page.goBack();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(card).toBeFocused();
  await page.goForward();
  await expect(page.locator("#project-page-title")).toBeFocused();
});

test("แสดง chip ที่เลือกและยังมี focus เมื่อล้าง tag ที่พบโปรเจกต์เดียว", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Search and quick actions/ }).press("Control+k");
  const search = page.getByRole("combobox", { name: "Search commands" });
  await search.fill("Amazon Bedrock");
  await search.press("Enter");
  const row = page.getByRole("group", { name: "Filter projects by technology" });
  const chip = row.getByRole("button", { name: /Amazon Bedrock/ });
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  const bounds = (await row.boundingBox())!;
  const active = (await chip.boundingBox())!;
  expect(active.x).toBeGreaterThanOrEqual(bounds.x);
  expect(active.x + active.width).toBeLessThanOrEqual(bounds.x + bounds.width);
  await chip.press("Enter");
  await expect(page.locator("#projects-status")).toBeFocused();
  await expect(chip).toHaveCount(0);
});

test("แจ้งข้อผิดพลาดเมื่อวิดีโอโหลดไม่ได้และลองใหม่ได้", async ({ page }) => {
  await page.route("**/*kbtg-mascot*.mp4", (route) => route.abort(), { times: 1 });
  await page.goto("/projects/katang");
  await page.getByRole("button", { name: /Play video/ }).click();
  const viewer = page.getByRole("dialog", { name: "Photo viewer" });
  await expect(viewer.getByRole("status")).toHaveText("Could not load this video.");
  await viewer.getByRole("button", { name: "Try again" }).click();
  await expect(viewer.locator("video")).toHaveAttribute("poster", /kbtg-mascot/);
});

test("เมนูแนวนอนเลื่อนถึง CV และชื่อยังอยู่ในจอเมื่อขยายตัวอักษร", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  const download = page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: /Download resume/ });
  await download.scrollIntoViewIfNeeded();
  await expect(download).toBeInViewport({ ratio: 0.95 });
  await menu.click();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addStyleTag({ content: "html { font-size: 200% }" });
  await expect(menu).toBeInViewport({ ratio: 0.95 });
  const lastLetter = page.locator("#hero-heading .hero-letter").last();
  await expect(lastLetter).toBeInViewport({ ratio: 0.95 });
});

test("Back จากผลกรองคืน focus ไปยังปุ่มใน Skills", async ({ page }) => {
  await page.goto("/#skills");
  const skills = page.locator("#skills");
  await skills.getByRole("button", { name: "Graph", exact: true }).click();
  const select = skills.locator("select");
  await expect(select).toHaveCount(1);
  if (await select.isVisible()) {
    await select.selectOption("React Native");
  } else {
    const graph = skills.getByRole("list", { name: "Skills in projects" });
    const selected = graph.getByRole("button", { name: /^React Native/ });
    await selected.click();
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    await graph.getByRole("button", { name: /^Python / }).hover();
  }
  await expect(skills.getByRole("heading", { name: "React Native · Used in 1 project" })).toBeVisible();
  const filter = skills.getByRole("button", { name: "Filter 1 project in Projects →" });
  await filter.focus();
  await filter.press("Enter");
  await expect(page.locator("#projects-status")).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/#skills$/);
  await expect(filter).toBeFocused();
});
