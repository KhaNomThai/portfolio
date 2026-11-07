/**
 * ตรวจข้อมูลที่ผิดแล้วไม่มีอะไรพัง (lint/build ผ่าน แต่หน้าเว็บแสดงผิด): `npm run check:data` (exit 1 ถ้าเจอ)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { familyOf } from "../src/config/skillFamilies.ts";
import { githubUrl, leadership, linkedinUrl, profile, projects, skillGroups, work } from "../src/data.ts";
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

// marks ของการ์ด/รายการที่ไม่อยู่ในข้อความช่องไหนเลยจะไม่ถูกขีด โดยไม่มีอะไรเตือน
const marked = [
  ...projects.map((p) => ({ id: p.id, marks: p.marks, texts: [p.desc, p.problem, p.approach, p.result] })),
  ...[...work, ...leadership].map((t) => ({ id: t.id, marks: t.marks, texts: t.bullets })),
];
for (const { id, marks = [], texts } of marked) {
  for (const phrase of marks) {
    if (!texts.some((text) => text?.includes(phrase))) errors.push(`marks "${phrase}" ของ ${id} ไม่อยู่ในข้อความของรายการนั้น`);
  }
}

// noscript / JSON-LD / OG ใน index.html เขียนค่าเหล่านี้ไว้ตรง ๆ (หน้า HTML ไม่ได้อ่าน data.ts)
const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
for (const value of [profile.email, profile.siteUrl, githubUrl, linkedinUrl]) {
  if (!html.includes(value)) errors.push(`index.html ไม่มี "${value}" จาก src/data.ts`);
}

if (errors.length > 0) {
  console.log(errors.join("\n"));
  process.exit(1);
}
console.log("ข้อมูลใน data.ts กับ index.html ตรงกัน");
