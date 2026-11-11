import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const ROOT = resolve(import.meta.dirname, "../..");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

function findChrome() {
  const found = CHROME_CANDIDATES.find((path) => path !== undefined && existsSync(path));
  if (!found) throw new Error("ไม่พบ Chrome — ตั้ง env CHROME_PATH ให้ชี้ไปที่ไฟล์ Chrome/Chromium");
  return found;
}

/**
 * เปิด URL ด้วย Chrome headless ตาม flags (print-to-pdf / screenshot)
 * ใช้ user-data-dir ชั่วคราว → ไม่ชนกับ Chrome ที่เปิดใช้งานอยู่
 * flags มาทีหลังค่าเริ่มต้น จึงใส่ --virtual-time-budget ทับได้ (หน้าเว็บจริงต้องรอนานกว่าไฟล์ในเครื่อง)
 */
export function runChrome(url: string, flags: string[]) {
  const profile = mkdtempSync(join(tmpdir(), "portfolio-chrome-"));
  try {
    execFileSync(
      findChrome(),
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--virtual-time-budget=3000",
        `--user-data-dir=${profile}`,
        ...flags,
        url,
      ],
      // เว็บภายนอกที่ค้างต้องไม่ทำให้สคริปต์ค้างตาม
      { stdio: "pipe", timeout: 90_000 }
    );
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
}

/** เขียน HTML ลงไฟล์ชั่วคราวแล้วให้ Chrome headless render ตาม flags */
export function renderWithChrome(html: string, flags: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "portfolio-"));
  const file = join(dir, "page.html");
  writeFileSync(file, html);
  try {
    runChrome(pathToFileURL(file).href, flags);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const dataUri = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString("base64")}`;

type Face = { file: string; weight: string; style?: "italic" };
const staticFaces = (pkg: string, name: string, faces: [number, "normal" | "italic"][]): Face[] =>
  faces.map(([weight, style]) => ({
    file: `node_modules/@fontsource/${pkg}/files/${name}-latin-${weight}-${style}.woff2`,
    weight: String(weight),
    ...(style === "italic" && { style }),
  }));

/**
 * รูป OG ใช้ไฟล์ variable ชุดเดียวกับเว็บ ส่วน CV ใช้ไฟล์ static (`@fontsource/*` ใน devDependencies):
 * Chrome ฝังฟอนต์ variable ลง PDF เป็น Type3 ซึ่ง parser ของ ATS บางตัวดึงข้อความไม่ได้ ไฟล์ static ถูกฝังเป็น TrueType
 */
const FONTS = {
  Newsreader: [{ file: "node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2", weight: "200 800" }],
  "IBM Plex Sans": [{ file: "node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2", weight: "100 700" }],
  "Newsreader Static": staticFaces("newsreader", "newsreader", [[500, "normal"], [500, "italic"]]),
  "IBM Plex Sans Static": staticFaces("ibm-plex-sans", "ibm-plex-sans", [[400, "normal"], [600, "normal"]]),
} satisfies Record<string, Face[]>;

/**
 * ฝังฟอนต์เป็น base64 → render ได้ทันทีไม่ต้องรอโหลดไฟล์ ฝังเฉพาะ family ที่หน้านั้นใช้:
 * hash ของ CV คิดจาก HTML ทั้งก้อน ถ้าฝังฟอนต์ของเว็บไปด้วย อัปเดตแพ็กเกจฟอนต์เว็บแล้ว CI จะแดงทั้งที่ CV ไม่เปลี่ยน
 */
export function fontFaceCss(families: (keyof typeof FONTS)[]) {
  return families
    .flatMap((family) =>
      FONTS[family].map(
        (face: Face) =>
          `@font-face { font-family: "${family}"; font-weight: ${face.weight}; font-style: ${face.style ?? "normal"}; src: url(${dataUri(face.file, "font/woff2")}) format("woff2"); }`
      )
    )
    .join("\n");
}

/** PDF เก็บ JPEG ได้ตรง ๆ (WebP จะถูกแปลงเป็น bitmap ไม่บีบอัด ไฟล์ใหญ่หลายร้อย KB) */
export const cvPhotoDataUri = () => dataUri("scripts/assets/cv-photo.jpg", "image/jpeg");
export const avatarDataUri = () => dataUri("src/assets/images/profile/profile-640.webp", "image/webp");

/** escape ข้อความก่อนแทรกลง HTML */
export const esc = (text: string) =>
  text.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch] ?? ch);
