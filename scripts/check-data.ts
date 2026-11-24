/**
 * ตรวจข้อมูลที่ผิดแล้วไม่มีอะไรพัง (lint/build ผ่าน แต่หน้าเว็บแสดงผิด): `npm run check:data` (exit 1 ถ้าเจอ)
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { PHOTO_SIZE, experienceMedia } from "../src/config/experienceMedia.ts";
import { PORTRAIT_SIZE, SHOT_SIZE, projectGallery, projectMedia } from "../src/config/projectMedia.ts";
import { familyOf } from "../src/config/skillFamilies.ts";
import { certifications, cvLeadership, githubUrl, heroTracks, highlights, leadership, linkedinUrl, profile, projects, skillGroups, work } from "../src/data.ts";
import { primOrder } from "../src/lib/prim.ts";
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
// title: ProjectPage สร้าง title ของหน้าแรกจาก profile ตอนปิดหน้า explore
const homeTitle = `<title>${profile.name} — ${profile.role} · ${profile.focus}</title>`.replace("&", "&amp;");
for (const value of [profile.email, profile.siteUrl, githubUrl, linkedinUrl, homeTitle]) {
  if (!html.includes(value)) errors.push(`index.html ไม่มี "${value}" จาก src/data.ts`);
}

// วิดีโอที่ไม่มีไฟล์ทำให้ <video> เปิดไม่ขึ้นโดย build ยังผ่าน
const expected = new Set<string>();
for (const [id, photos] of Object.entries(experienceMedia)) {
  for (const { video } of photos) {
    if (!video) continue;
    const file = `src/assets/videos/${id}/${video}.mp4`;
    expected.add(file);
    if (!existsSync(resolve(ROOT, file))) errors.push(`ไม่มีไฟล์ ${file}`);
  }
}

// รูป: id ที่พิมพ์ผิดทำให้รูปหายเงียบ ๆ ส่วนไฟล์ที่ขาดทำให้ <img> ชี้ไป "undefined" โดย build ยังผ่าน
const media = [
  ...Object.keys(projectMedia).map((id) => ({ id, known: projects.some((p) => p.id === id), dir: "projects", name: id, width: SHOT_SIZE.width })),
  ...Object.entries(experienceMedia).flatMap(([id, photos]) =>
    photos.map((photo) => ({
      id,
      known: [...work, ...leadership, ...certifications, ...projects].some((t) => t.id === id),
      dir: "experience",
      name: photo.file,
      width: PHOTO_SIZE.width,
    }))
  ),
  ...Object.entries(projectGallery).flatMap(([id, shots]) =>
    shots.map(({ file, portrait }) => ({
      id,
      known: projects.some((p) => p.id === id),
      dir: "projects",
      name: file,
      width: portrait ? PORTRAIT_SIZE.width : SHOT_SIZE.width,
    }))
  ),
];
for (const { id, known, dir, name, width } of media) {
  if (!known) errors.push(`รูปของ "${id}" ไม่ตรงกับ id ไหนใน data.ts`);
  for (const w of [width, width / 2]) {
    const file = `src/assets/images/${dir}/${id}/${name}-${w}.webp`;
    expected.add(file);
    if (!existsSync(resolve(ROOT, file))) errors.push(`ไม่มีไฟล์ ${file} (รัน npm run ${dir === "projects" ? "shots" : "photos"})`);
  }
}

// ทุกไฟล์ในโฟลเดอร์เหล่านี้ถูก bundle ขึ้นเว็บ (src/lib/media.ts) จึงนับทั้งโฟลเดอร์ ไม่ใช่แค่ไฟล์ที่ mapping อ้างถึง
// รูปและวิดีโอโหลดแบบ lazy (วิดีโอโหลดเมื่อเปิดใน lightbox) งบนี้คุมขนาด deploy/repo ไม่ใช่น้ำหนักหน้าแรก
const MEDIA_BUDGET_KB = 4800;
const mediaFiles = ["src/assets/images/experience", "src/assets/images/projects", "src/assets/videos"].flatMap((dir) =>
  existsSync(resolve(ROOT, dir))
    ? readdirSync(resolve(ROOT, dir), { recursive: true, encoding: "utf8" })
        .map((file) => `${dir}/${file}`)
        .filter((file) => statSync(resolve(ROOT, file)).isFile() && !file.endsWith(".DS_Store"))
    : []
);
const mediaKb = mediaFiles.reduce((sum, file) => sum + statSync(resolve(ROOT, file)).size / 1024, 0);
// ไฟล์ที่ไม่มีใน mapping: วางนอกโฟลเดอร์ id (src/lib/media.ts หาไม่เจอ) หรือรูปที่เลิกใช้แล้วแต่ยังถูกนับขนาด deploy
for (const file of mediaFiles) if (!expected.has(file)) errors.push(`${file} ไม่ได้ใช้ หรือไม่ได้อยู่ในโฟลเดอร์ <id>/ ที่ถูกต้อง`);
if (mediaKb > MEDIA_BUDGET_KB) errors.push(`รูปและวิดีโอรวม ${mediaKb.toFixed(0)} KB เกินงบ ${MEDIA_BUDGET_KB} KB: ลดจำนวนรูป/วิดีโอ หรือ QUALITY ในสคริปต์`);

// กราฟ MST ใน labFigure ต้องเชื่อมกันครบทุก vertex ไม่อย่างนั้นปุ่ม Next บนการ์ดหยุดก่อนจบต้นไม้
// ตรวจ primOrder เองด้วยกราฟสามเหลี่ยมที่รู้คำตอบ: จาก 1 ต้องได้ 1→3 (1) แล้ว 3→2 (2) ไม่ใช่ 1→2 (5)
const known = primOrder(1, 3, [{ from: 1, to: 2, weight: 5 }, { from: 1, to: 3, weight: 1 }, { from: 2, to: 3, weight: 2 }]);
if (known.map((s) => `${s.from}-${s.to}`).join(",") !== "1-3,3-2") errors.push("primOrder ใน src/lib/prim.ts คำนวณลำดับ Prim ผิด");
for (const p of projects) {
  const f = p.labFigure;
  // ค่านอกช่วงแกนจะถูกวาดหลุดกรอบของ dumbbell
  if (f?.kind === "dumbbell") {
    const [min, max] = f.scale;
    for (const row of f.rows) {
      if ([row.student, row.model].some((v) => v < min || v > max)) errors.push(`"${row.label}" ใน labFigure ของ ${p.id} อยู่นอกช่วง ${min}–${max}`);
    }
  }
  if (f?.kind !== "mst") continue;
  const ids = new Set(f.nodes.map((n) => n.id));
  for (const e of f.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) errors.push(`เส้น ${e.from}-${e.to} ใน labFigure ของ ${p.id} ชี้ไป vertex ที่ไม่มี`);
  }
  if (primOrder(f.nodes[0].id, f.nodes.length, f.edges).length !== f.nodes.length - 1) errors.push(`กราฟ MST ของ ${p.id} ไม่เชื่อมกันครบทุก vertex`);
}

// ปลายทางของปุ่มกระโดดหาหลักฐานใน Hero ต้องเป็น id ที่มีจริง (id ผิด = กดแล้วไม่ไปไหน)
const targetIds: Record<string, Set<string>> = {
  projects: new Set(projects.map((p) => p.id)),
  experience: new Set([...work, ...leadership].map((i) => i.id)),
};
const heroItems = heroTracks.flatMap((t) => t.items);
for (const t of [...highlights.map((h) => h.target), ...heroItems.map((i) => i.target)]) {
  if (t && !targetIds[t.section]?.has(t.itemId)) errors.push(`target ${t.section}/${t.itemId} ใน Hero ไม่มีอยู่จริง`);
}
for (const i of heroItems) if (i.projectId && !targetIds.projects.has(i.projectId)) errors.push(`projectId "${i.projectId}" ใน heroTracks ไม่มีอยู่จริง`);

if (errors.length > 0) {
  console.log(errors.join("\n"));
  process.exit(1);
}
console.log("ข้อมูลใน data.ts กับ index.html ตรงกัน");
