/**
 * สร้าง CV PDF (A4 หน้าเดียว) จาก src/data.ts → src/assets/Kulachart-Parnduangkeaw-CV.pdf
 * เว็บกับ CV ใช้ข้อมูลชุดเดียวกัน — แก้ data.ts แล้วรัน `npm run cv` (ต้องมี Google Chrome)
 * ไม่ใส่ที่อยู่บ้าน: ไฟล์นี้ใครก็ดาวน์โหลดจากเว็บได้
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  certifications,
  cvKeyResults,
  cvSkills,
  education,
  githubUrl,
  leadership,
  linkedinUrl,
  profile,
  projects,
  work,
} from "../src/data.ts";
import { ROOT, cvPhotoDataUri, esc, fontFaceCss, renderWithChrome } from "./lib/chrome.ts";

const OUTPUT = resolve(ROOT, "src/assets/Kulachart-Parnduangkeaw-CV.pdf");
/**
 * hash ของ HTML ที่ใช้สร้าง PDF ล่าสุด: PDF ที่ Chrome สร้างมีวันที่ฝังอยู่ เทียบไฟล์ตรง ๆ ไม่ได้
 * hash นี้จึงใช้ทั้งข้ามการสร้างใหม่เมื่อเนื้อหาไม่เปลี่ยน และให้ CI (`--check`) จับ PDF ที่ไม่ตรงกับ data.ts โดยไม่ต้องมี Chrome
 */
const HASH_FILE = resolve(ROOT, "src/assets/cv.sha256");
/**
 * CV เล็งตำแหน่ง Data Science / AI: เลือกรายการตามหลักฐานสาย DS ไม่ใช่ตามลำดับบนเว็บ (ที่ไม่ได้เลือกยังอยู่บนเว็บครบ)
 * ต้องจบในหน้าเดียว ถ้าล้นให้ตัดรายการท้าย ๆ ออกจากสองรายการนี้ก่อน
 */
const CV_PROJECTS = ["skin-cancer-screening", "peak-electricity-alert", "smart-flood-ai", "katang", "employment-gap-analysis"];
const CV_LEADERSHIP = ["cpe-student-leader", "robotics-teaching-assistant"];

function pick<T extends { id: string }>(items: T[], ids: string[]) {
  return ids.map((id) => {
    const item = items.find((it) => it.id === id);
    if (!item) throw new Error(`ไม่พบ id "${id}" ใน src/data.ts`);
    return item;
  });
}

const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;

/** ไฮไลต์เฉพาะวลีใน `cvMarks` (ผลลัพธ์ 1 จุดต่อรายการ) ไม่ใช้ `marks` ของเว็บ เพราะบนเว็บบางวลีไม่ใช่ผลลัพธ์ */
function marked(text: string, marks: string[] = []) {
  return marks.reduce((html, phrase) => html.replace(esc(phrase), `<b class="mark">${esc(phrase)}</b>`), esc(text));
}

/** วันที่อยู่บรรทัดเดียวกับชื่อรายการ: ถ้าจัดชิดขวา parser ของ ATS บางตัวแยกวันที่ไปไว้ท้าย section */
function item(title: string, meta: string[], body: string) {
  return `
    <div class="item">
      <p class="item-head"><span class="title">${title}</span> <span class="meta">— ${meta.map(esc).join(" · ")}</span></p>
      ${body}
    </div>`;
}

// ห่อข้อความด้วย span: li เป็น flex ถ้าไม่ห่อ ตัวหนาที่ไฮไลต์จะกลายเป็น flex item แยกคอลัมน์
const bullets = (lines: string[], marks?: string[]) =>
  `<ul>${lines.map((line) => `<li><span>${marked(line, marks)}</span></li>`).join("")}</ul>`;

const contactLine = [
  esc(profile.location),
  esc(profile.phone),
  link(`mailto:${profile.email}`, profile.email),
  link(profile.siteUrl, shortUrl(profile.siteUrl)),
  link(linkedinUrl, shortUrl(linkedinUrl)),
  link(githubUrl, shortUrl(githubUrl)),
]
  .map((part) => `<span class="nowrap">${part}</span>`)
  // ต้องมีช่องว่างคั่น ไม่งั้นทั้งบรรทัดตัดไม่ได้ → ล้นขอบ และ Chrome จะย่อทั้งหน้าให้พอดี (ตัวหนังสือเล็กลงทั้ง CV)
  .join(' <span class="sep">·</span> ');

const keyResults = cvKeyResults
  .map((k) => `<span class="nowrap"><b class="mark">${esc(k.value)}</b> ${esc(k.label)}</span>`)
  .join(' <span class="sep">/</span> ');

const workItems = work
  .map((w) => item(`${esc(w.title)}`, [w.org, w.period], bullets(w.cvBullets ?? w.bullets, w.cvMarks)))
  .join("");

const projectItems = pick(projects, CV_PROJECTS)
  .map((p) =>
    item(
      link(p.links[0].href, p.title),
      [p.context ?? p.category, p.year].filter((part): part is string => Boolean(part)),
      `${bullets(p.cvBullets ?? [p.desc], p.cvMarks)}<p class="tech">${p.tags.map(esc).join(" · ")}</p>`
    )
  )
  .join("");

const educationItems = [
  ...education.map((e) =>
    item(
      esc(e.degree),
      [e.school, [e.period, e.graduation].filter(Boolean).join(" · ")],
      `<p>Relevant coursework: ${(e.cvCoursework ?? e.coursework).map(esc).join(", ")}</p>`
    )
  ),
  ...certifications.map((c) => `<p>${c.href ? link(c.href, c.title) : esc(c.title)} — ${esc(c.issuer)}, ${esc(c.year)}</p>`),
].join("");

const leadershipItems = pick(leadership, CV_LEADERSHIP)
  .map((l) => item(esc(l.title), [l.org, l.period], bullets(l.cvBullets ?? l.bullets, l.cvMarks)))
  .join("");

const skillLines = cvSkills.map((g) => `<p><span class="label">${esc(g.title)}:</span> ${g.items.map(esc).join(", ")}</p>`).join("");

// logo Serif K. (กติกาใน DESIGN_SYSTEM.md) ตัด comment กับ <title> ออก: ไม่ต้องอยู่ใน PDF
const logo = readFileSync(resolve(ROOT, "design/logo/k-serif.svg"), "utf8")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<title[\s\S]*?<\/title>/, "");

// สีมาจาก src/styles/tokens.css (โหมดสว่าง): ink, ink-muted, pen, rule, stroke, margin, marker
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(profile.name)} — CV</title>
<style>
${fontFaceCss(["Newsreader Static", "IBM Plex Sans Static"])}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { font-family: "IBM Plex Sans Static", sans-serif; font-size: 8.6pt; line-height: 1.36; color: #141b2b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
/* เส้น margin สีแดงของหน้าสมุดเป็นพื้นหลังของ body: ไม่ใช้ position จึงไม่กระทบลำดับข้อความใน PDF */
body { min-height: 297mm; padding: 9mm 13mm 8mm 25mm; background: linear-gradient(90deg, transparent 18.5mm, #d9464e 18.5mm, #d9464e calc(18.5mm + 0.8px), transparent calc(18.5mm + 0.8px)); }
a { color: #2343c4; text-decoration: none; }
header { display: flex; align-items: center; gap: 14px; padding-bottom: 7px; border-bottom: 0.8px solid #d5dce6; }
.logo { flex: none; width: 13mm; height: 13mm; }
.logo svg { display: block; width: 100%; height: 100%; }
.who { flex: 1; }
h1 { font-family: "Newsreader Static", serif; font-size: 23pt; font-weight: 500; line-height: 1.05; letter-spacing: -0.01em; }
.headline { margin-top: 2px; font-size: 9.6pt; color: #4b5568; }
.contact { margin-top: 4px; font-size: 7.9pt; color: #4b5568; }
.nowrap { white-space: nowrap; }
.sep { color: #7e899a; }
.photo { flex: none; width: 19mm; height: 19mm; border-radius: 50%; object-fit: cover; }
.key-results { margin-top: 6px; padding-bottom: 5px; border-bottom: 0.8px solid #d5dce6; font-size: 8.4pt; }
.key-results .label { font-family: "Newsreader Static", serif; font-style: italic; font-weight: 500; font-size: 10.5pt; margin-right: 6px; }
/* หัว section ไม่ใส่ letter-spacing: parser ของ ATS อ่านตัวอักษรที่ถ่างเป็น "S U M M A R Y" แล้วหา section ไม่เจอ */
h2 { font-family: "Newsreader Static", serif; font-style: italic; font-weight: 500; font-size: 12pt; line-height: 1.1; margin-top: 8px; padding-bottom: 1px; border-bottom: 0.8px solid #d9464e; }
section > p { margin-top: 3px; }
.item { break-inside: avoid; margin-top: 4.5px; }
.item + p { margin-top: 1px; }
.title { font-weight: 600; }
.meta { color: #4b5568; }
/* ห้ามใช้ position กับ li: Chrome จะวาด (และเขียนข้อความลง PDF) ทีหลังเนื้อหาอื่นทั้งหมด
   → ATS ที่อ่านข้อความตามลำดับใน PDF จะเห็น bullet หลุดไปอยู่ท้ายไฟล์ */
ul { list-style: none; }
li { display: flex; gap: 6px; margin-top: 1px; }
li::before { content: ""; flex: none; width: 3.5px; height: 3.5px; margin: 0.55em 0 0 1px; border-radius: 50%; background: #2343c4; }
/* margin ติดลบครึ่งหนึ่งของ padding: ถ้าไม่ติดลบดูเหมือนมีวรรคเกินก่อน "." หรือหลัง "(" ถ้าติดลบเท่า padding พื้นเหลืองจะชนคำข้าง ๆ */
.mark { font-weight: 600; background: #ffe566; padding: 0 2px; margin: 0 -1px; border-radius: 1px; }
.tech { margin-top: 1px; font-size: 7.6pt; color: #4b5568; }
.skills p { margin-top: 1.5px; }
.label { font-weight: 600; }
</style>
</head>
<body>
  <header>
    <div class="logo">${logo}</div>
    <div class="who">
      <h1>${esc(profile.name)}</h1>
      <p class="headline">${esc(profile.cvHeadline)}</p>
      <p class="contact">${contactLine}</p>
    </div>
    <img class="photo" src="${cvPhotoDataUri()}" alt="" />
  </header>
  <p class="key-results"><span class="label">Key results</span> ${keyResults}</p>

  <section><h2>Summary</h2><p>${esc(profile.cvSummary)}</p></section>
  <section><h2>Experience</h2>${workItems}</section>
  <section><h2>Projects</h2>${projectItems}</section>
  <section><h2>Education</h2>${educationItems}</section>
  <section><h2>Leadership &amp; Teaching</h2>${leadershipItems}</section>
  <section><h2>Skills</h2><div class="skills">${skillLines}</div></section>
</body>
</html>`;

const hash = createHash("sha256").update(html).digest("hex");
const savedHash = existsSync(HASH_FILE) ? readFileSync(HASH_FILE, "utf8").trim() : "";

if (process.argv.includes("--check")) {
  if (hash !== savedHash) {
    console.error("CV PDF ไม่ตรงกับ src/data.ts: รัน `npm run cv` แล้ว commit ทั้ง PDF และ src/assets/cv.sha256");
    process.exit(1);
  }
  console.log("CV PDF ตรงกับ src/data.ts");
} else if (hash === savedHash && existsSync(OUTPUT)) {
  console.log("เนื้อหา CV ไม่เปลี่ยน ไม่ได้สร้าง PDF ใหม่");
} else {
  renderWithChrome(html, [`--print-to-pdf=${OUTPUT}`, "--no-pdf-header-footer"]);
  // นับ object หน้าใน PDF (/Type /Page แต่ไม่ใช่ /Pages): ล้นเป็นสองหน้าแล้ว Chrome ไม่เตือนอะไร
  const pages = readFileSync(OUTPUT, "latin1").match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
  if (pages !== 1) {
    // ลบ hash เดิม: PDF บนดิสก์ตอนนี้คือฉบับที่ล้น รอบหน้าต้องสร้างใหม่เสมอ และ `--check` ใน CI แดงจนกว่าจะแก้
    rmSync(HASH_FILE, { force: true });
    console.error(`CV มี ${pages} หน้า ต้องเป็น A4 หน้าเดียว: ตัดรายการท้าย ๆ ของ CV_PROJECTS หรือ CV_LEADERSHIP หรือย่อ cvBullets`);
    process.exit(1);
  }
  writeFileSync(HASH_FILE, `${hash}\n`);
  console.log(`CV → ${OUTPUT}`);
}
