/**
 * ตรวจข้อมูลที่ผิดแล้วไม่มีอะไรพัง (lint/build ผ่าน แต่หน้าเว็บแสดงผิด): `npm run check:data` (exit 1 ถ้าเจอ)
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { PHOTO_SIZE, experienceMedia } from "../src/config/experienceMedia.ts";
import { SHOT_SIZE, projectMedia } from "../src/config/projectMedia.ts";
import { familyOf } from "../src/config/skillFamilies.ts";
import { certifications, cvLeadership, githubUrl, leadership, linkedinUrl, profile, projects, skillGroups, work } from "../src/data.ts";
import { ROOT } from "./lib/chrome.ts";

const errors: string[] = [];

// ชื่อที่ไม่มีหมวดจะถูกนับเป็น Tools แบบไม่มีสัญลักษณ์ → ยอมเฉพาะชื่อที่ตั้งใจใส่ไว้ในกลุ่ม Tools
const tools = new Set(skillGroups.find((g) => g.title === "Tools")?.skills.map((s) => s.name));
const names = new Set([...projects.flatMap((p) => p.tags), ...skillGroups.flatMap((g) => g.skills.map((s) => s.name))]);
for (const name of names) {
  if (!familyOf(name) && !tools.has(name)) errors.push(`"${name}" ไม่มีหมวด: เพิ่มใน src/config/skillFamilies.ts หรือกลุ่ม Tools`);
}

// วลีที่หาไม่เจอจะไม่ถูกขีดเน้นใน hero และเตือนแค่ใน console ตอน dev
for (const phrase of profile.summaryMarks) {
  if (!profile.summary.includes(phrase)) errors.push(`summaryMarks "${phrase}" ไม่อยู่ใน profile.summary`);
}

// marks ของการ์ด/รายการที่ไม่อยู่ในข้อความที่แสดงจริงจะไม่ถูกขีด โดยไม่มีอะไรเตือน
// การ์ดที่มีทั้ง problem และ approach ไม่แสดง desc (เงื่อนไขเดียวกับ ProjectFields) จึงไม่นับ desc ของการ์ดนั้น
const marked = [
  ...projects.map((p) => ({
    id: p.id,
    marks: p.marks,
    texts: p.problem && p.approach ? [p.problem, p.approach, p.result] : [p.desc, p.result],
  })),
  ...[...work, ...leadership].map((t) => ({ id: t.id, marks: t.marks, texts: t.bullets })),
];
for (const { id, marks = [], texts } of marked) {
  for (const phrase of marks) {
    if (!texts.some((text) => text?.includes(phrase))) errors.push(`marks "${phrase}" ของ ${id} ไม่อยู่ในข้อความของรายการนั้น`);
  }
}

// cvMarks ที่หาไม่เจอจะไม่ถูกไฮไลต์ใน CV PDF โดยไม่มีอะไรเตือน (ข้อความที่ CV ใช้ เงื่อนไขเดียวกับ build-cv.ts)
// โปรเจกต์ที่มี cvShort อาจเป็นได้ทั้งรายการเต็ม (cvBullets) และแถวสั้น (cvShort) ตาม CV_PROJECTS จึงต้องเจอทั้งสองที่
const cvMarked = [
  ...projects.flatMap((p) => [
    { id: p.id, marks: p.cvMarks, texts: p.cvBullets ?? [p.desc] },
    ...(p.cvShort ? [{ id: `${p.id} (cvShort)`, marks: p.cvMarks, texts: [p.cvShort] }] : []),
  ]),
  ...[...work, ...leadership, ...cvLeadership].map((t) => ({ id: t.id, marks: t.cvMarks, texts: t.cvBullets ?? t.bullets })),
];
for (const { id, marks = [], texts } of cvMarked) {
  for (const phrase of marks) {
    if (!texts.some((text) => text.includes(phrase))) errors.push(`cvMarks "${phrase}" ของ ${id} ไม่อยู่ในข้อความที่ CV ใช้`);
  }
}

// noscript / JSON-LD / OG ใน index.html เขียนค่าเหล่านี้ไว้ตรง ๆ (หน้า HTML ไม่ได้อ่าน data.ts)
const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
for (const value of [profile.email, profile.siteUrl, githubUrl, linkedinUrl]) {
  if (!html.includes(value)) errors.push(`index.html ไม่มี "${value}" จาก src/data.ts`);
}

// รูป: id ที่พิมพ์ผิดทำให้รูปหายเงียบ ๆ ส่วนไฟล์ที่ขาดทำให้ <img> ชี้ไป "undefined" โดย build ยังผ่าน
const media = [
  ...Object.keys(projectMedia).map((id) => ({ id, known: projects.some((p) => p.id === id), dir: "projects", name: id, width: SHOT_SIZE.width })),
  ...Object.entries(experienceMedia).flatMap(([id, photos]) =>
    photos.map((photo) => ({
      id,
      known: [...work, ...leadership, ...certifications].some((t) => t.id === id),
      dir: "experience",
      name: photo.file,
      width: PHOTO_SIZE.width,
    }))
  ),
];
for (const { id, known, dir, name, width } of media) {
  if (!known) errors.push(`รูปของ "${id}" ไม่ตรงกับ id ไหนใน data.ts`);
  for (const w of [width, width / 2]) {
    const file = `src/assets/images/${dir}/${name}-${w}.webp`;
    if (!existsSync(resolve(ROOT, file))) errors.push(`ไม่มีไฟล์ ${file} (รัน npm run ${dir === "projects" ? "shots" : "photos"})`);
  }
}

// ทุกไฟล์ในสองโฟลเดอร์นี้ถูก bundle ขึ้นเว็บ (src/lib/media.ts) จึงนับทั้งโฟลเดอร์ ไม่ใช่แค่ไฟล์ที่ mapping อ้างถึง
const MEDIA_BUDGET_KB = 1500;
const mediaKb = ["src/assets/images/experience", "src/assets/images/projects"]
  .flatMap((dir) => (existsSync(resolve(ROOT, dir)) ? readdirSync(resolve(ROOT, dir)).map((file) => statSync(resolve(ROOT, dir, file)).size) : []))
  .reduce((sum, size) => sum + size / 1024, 0);
if (mediaKb > MEDIA_BUDGET_KB) errors.push(`รูปรวม ${mediaKb.toFixed(0)} KB เกินงบ ${MEDIA_BUDGET_KB} KB: ลดจำนวนรูปหรือ QUALITY ในสคริปต์`);

if (errors.length > 0) {
  console.log(errors.join("\n"));
  process.exit(1);
}
console.log("ข้อมูลใน data.ts กับ index.html ตรงกัน");
