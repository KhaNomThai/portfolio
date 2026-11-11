/**
 * จับ screenshot หน้า demo ของโปรเจกต์เป็น WebP สองขนาดใน src/assets/images/projects/: `npm run shots` (ต้องมี Google Chrome และต่อเน็ต)
 * จับเฉพาะ id ที่อยู่ใน src/config/projectMedia.ts มีลิงก์ demo ใน data.ts และไม่ได้ระบุ manual
 * ระบุ id ต่อท้ายเพื่อจับบางโปรเจกต์ได้: `npm run shots -- skin-cancer-screening` (เว็บอื่นเปลี่ยนหน้าตาได้ ไม่จำเป็นต้องจับใหม่ทุกอันทุกครั้ง)
 * หน้าที่ได้ออกมาเป็นสีเดียวทั้งภาพ (โหลดไม่ขึ้น) จะไม่ถูกเขียนทับไฟล์เดิม และสคริปต์จบด้วย exit 1
 * สคริปต์รู้แค่ว่าหน้า "เปล่า" ไหม หน้า error หรือหน้า login ต้องเปิดดูไฟล์ที่ได้เองทุกครั้ง
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { SHOT_SIZE, projectMedia } from "../src/config/projectMedia.ts";
import { projects } from "../src/data.ts";
import { ROOT, runChrome } from "./lib/chrome.ts";

const OUTPUT_DIR = resolve(ROOT, "src/assets/images/projects");
const QUALITY = 80;
/** ส่วนเบี่ยงเบนของสีต่ำกว่านี้ทุก channel = ภาพแทบเป็นสีเดียว (0–255) */
const BLANK_STDEV = 3;

const only = process.argv.slice(2);
const unknown = only.filter((id) => !(id in projectMedia));
if (unknown.length > 0) {
  // id ที่พิมพ์ผิดต้องไม่จบแบบเงียบ ๆ ด้วย exit 0 จนคนรันคิดว่าจับรูปใหม่แล้ว
  console.error(`ไม่มี id ${unknown.join(", ")} ใน src/config/projectMedia.ts`);
  process.exit(1);
}
const ids = Object.keys(projectMedia).filter((id) => only.length === 0 || only.includes(id));
const failed: string[] = [];
const tmp = mkdtempSync(join(tmpdir(), "portfolio-shots-"));
mkdirSync(OUTPUT_DIR, { recursive: true });

try {
  for (const id of ids) {
    const project = projects.find((p) => p.id === id);
    const url = project?.links.find((link) => link.kind === "demo")?.href;
    if (!url || projectMedia[id].manual) {
      // โปรเจกต์ที่ไม่มี demo หรือระบุ manual ใช้ไฟล์ที่เจ้าของวางเอง
      if (existsSync(resolve(OUTPUT_DIR, `${id}-${SHOT_SIZE.width}.webp`))) console.log(`${id}: ใช้ไฟล์ที่วางไว้ ไม่จับใหม่`);
      else failed.push(`${id}: ไม่มีลิงก์ demo (หรือเป็น manual) และไม่มีไฟล์ใน src/assets/images/projects/`);
      continue;
    }

    const png = join(tmp, `${id}.png`);
    try {
      runChrome(url, [
        `--screenshot=${png}`,
        `--window-size=${SHOT_SIZE.width},${SHOT_SIZE.height}`,
        "--force-device-scale-factor=1",
        "--virtual-time-budget=10000",
        // animation ที่ยังเล่นไม่จบตอนถ่ายให้ค่าผิด (ตัวเลขที่กำลังนับขึ้นในเว็บนี้ออกมาเป็น 0.00) จึงขอหน้านิ่งในสภาพสุดท้าย
        "--force-prefers-reduced-motion",
      ]);
    } catch (error) {
      failed.push(`${id}: Chrome เปิด ${url} ไม่สำเร็จ (${error instanceof Error ? error.message.split("\n")[0] : error})`);
      continue;
    }

    const { channels } = await sharp(png).stats();
    if (channels.every((channel) => channel.stdev < BLANK_STDEV)) {
      failed.push(`${id}: ${url} ได้หน้าเปล่า ไม่ได้เขียนไฟล์`);
      continue;
    }

    for (const scale of [1, 0.5]) {
      const width = SHOT_SIZE.width * scale;
      const output = resolve(OUTPUT_DIR, `${id}-${width}.webp`);
      // position top: ถ้า Chrome ให้ภาพสูงไม่ตรง viewport เก็บส่วนบนของหน้าไว้
      await sharp(png).resize({ width, height: SHOT_SIZE.height * scale, fit: "cover", position: "top" }).webp({ quality: QUALITY }).toFile(output);
      console.log(`${id}-${width}.webp  ${(statSync(output).size / 1024).toFixed(0)} KB  ← ${url}`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed.length > 0) {
  console.error(failed.join("\n"));
  process.exit(1);
}
