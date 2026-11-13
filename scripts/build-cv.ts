/**
 * สร้าง CV PDF (A4 2 หน้าเป๊ะ) ภาพรวมทุกสาย (AI / Data, Web, Mobile, Leadership) จาก src/data.ts → src/assets/Kulachart-Parnduangkeaw-CV.pdf
 * หน้า 1 ต้องยืนได้เอง (recruiter อาจอ่านแค่หน้าแรก) จึงต้องเห็นทั้งงาน AI และงาน dev ส่วนหน้า 2 คือรายละเอียด
 * เว็บกับ CV ใช้ข้อมูลชุดเดียวกัน — แก้ data.ts แล้วรัน `npm run cv` (ต้องมี Google Chrome)
 * ไม่ใส่ที่อยู่บ้าน: ไฟล์นี้ใครก็ดาวน์โหลดจากเว็บได้
 *
 * ดีไซน์ "Editorial": ลำดับมาจากตัวอักษรกับช่องว่าง สีมีหน้าที่ละอย่างตาม DESIGN_SYSTEM.md
 * น้ำเงิน pen = สิ่งที่กดได้ (ตัวอักษรของลิงก์), เหลือง marker = ผลลัพธ์ที่แข็งที่สุด (cvKeyResults ที่มี mark),
 * แดง margin = เส้นตกแต่งเท่านั้น (ใต้หัว section, หัวบัตร QR) ข้อความทุกตัวผ่าน AA (≥ 4.5:1)
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import QRCode from "qrcode";
import {
  certifications,
  cvHonors,
  cvKeyResults,
  cvLeadership,
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
const PAGES = 2;
/**
 * hash ของ HTML ที่ใช้สร้าง PDF ล่าสุด: PDF ที่ Chrome สร้างมีวันที่ฝังอยู่ เทียบไฟล์ตรง ๆ ไม่ได้
 * hash นี้จึงใช้ทั้งข้ามการสร้างใหม่เมื่อเนื้อหาไม่เปลี่ยน และให้ CI (`--check`) จับ PDF ที่ไม่ตรงกับ data.ts โดยไม่ต้องมี Chrome
 */
const HASH_FILE = resolve(ROOT, "src/assets/cv.sha256");
/**
 * เรียงตามความแข็ง: CV_FEATURED อันแรกเป็นรายการเต็มใต้หัว Projects ที่เหลือเป็นแถวสั้นไม่เกินสองบรรทัดใต้ "More projects" (ใช้ cvShort)
 * peak-electricity-alert เป็นรายการเต็มแทน smart-flood-ai: มีผลวัดได้เทียบ baseline ซึ่งสาย Data/ML มองหา ส่วน Smart Flood ไม่มีตัวเลข
 * Projects ทั้งหมดต้องจบในหน้า 1 ถ้าล้นให้ตัดท้าย ๆ ออกก่อน (prim-visualizer, portfolio) ไม่งั้นแถวสั้นจะลอยขึ้นต้นหน้า 2 โดยไม่มีหัว
 */
const CV_PROJECTS = [
  "katang",
  "wellync",
  "skin-cancer-screening",
  "peak-electricity-alert",
  "smart-flood-ai",
  "swu-run-checker",
  "brainfit",
  "employment-gap-analysis",
  "prim-visualizer",
  "portfolio",
];
const CV_FEATURED = 4;
/** tech ของโปรเจกต์เด่นแสดงแค่ตัวหลัก keyword ครบอยู่ใน Skills (มี assert ด้านล่าง) */
const TECH_SHOWN = 4;
const CV_LEADERSHIP = ["cpe-student-leader", "robotics-teaching-assistant", "metaverse-presentation-assistant", "research-poster-assistant"];

function pick<T extends { id: string }>(items: T[], ids: string[]) {
  return ids.map((id) => {
    const item = items.find((it) => it.id === id);
    if (!item) throw new Error(`ไม่พบ id "${id}" ใน src/data.ts`);
    return item;
  });
}

const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;
/**
 * ชื่อที่กดได้เป็นตัวสี pen (7.4:1 บนพื้นขาว) ไม่มีเส้นใต้: สีบอกว่ากดได้ ตัวหนาบอกว่าเป็นชื่อรายการ
 * ไม่ใช้ลูกศร ↗ หลังชื่อ: ช่องว่างของรูปทำให้ PyMuPDF/pdfminer ตัดชื่อกับวันที่เป็นคนละบรรทัด ผิดกฎ ATS
 */
const titleLink = (href: string, text: string) => `<a class="title-link" href="${esc(href)}">${esc(text)}</a>`;

/** ตัดขีด/ตัวหนอนออกก่อนเทียบ: "top-30 round" ต้องจับคู่กับค่า "Top 30" ได้ */
const norm = (text: string) => text.toLowerCase().replace(/[-~]/g, " ").replace(/\s+/g, " ").trim();
const keyValues = cvKeyResults.map((k) => norm(k.value));

/**
 * วลีใน `cvMarks` เป็นตัวหนาสีหมึก ไม่มีพื้นเหลือง (เหลืองสงวนไว้ให้ Key results ที่มี mark)
 * ข้ามวลีที่ซ้ำกับค่าใน Key results: ผลเดียวกันเน้นหลายที่แล้วการเน้นอ่อนลง
 */
function marked(text: string, marks: string[] = []) {
  return marks
    .filter((phrase) => !keyValues.some((value) => norm(phrase).includes(value)))
    .reduce((html, phrase) => html.replace(esc(phrase), `<b>${esc(phrase)}</b>`), esc(text));
}

/**
 * วันที่อยู่บรรทัดเดียวกับชื่อรายการ: ถ้าจัดชิดขวา parser ของ ATS บางตัวแยกวันที่ไปไว้ท้าย section
 * หมวด (`cvTrack`) เป็นข้อความเล็กสีจางท้าย meta ไม่มีกรอบ ชื่อทุกรายการจึงเริ่มแนวเดียวกัน
 */
const head = (title: string, meta: string[], track?: string) =>
  `<p class="item-head"><span class="title">${title}</span> <span class="meta">— ${meta.map(esc).join(" · ")}</span>${
    track ? ` <span class="track">· ${esc(track)}</span>` : ""
  }</p>`;
const item = (title: string, meta: string[], body: string, track?: string) => `<div class="item">${head(title, meta, track)}${body}</div>`;

// ห่อข้อความด้วย span: li เป็น flex ถ้าไม่ห่อ ตัวหนาจะกลายเป็น flex item แยกคอลัมน์
const bullets = (lines: string[], marks?: string[]) =>
  `<ul>${lines.map((line) => `<li><span>${marked(line, marks)}</span></li>`).join("")}</ul>`;

// แบ่ง 2 บรรทัดเอง: ปล่อยตัดอัตโนมัติแล้วจุดคั่นค้างท้ายบรรทัด ดูเหมือนข้อความขาด
const contactLines = [
  [esc(profile.location), esc(profile.phone), link(`mailto:${profile.email}`, profile.email), link(profile.siteUrl, shortUrl(profile.siteUrl))],
  [link(linkedinUrl, shortUrl(linkedinUrl)), link(githubUrl, shortUrl(githubUrl))],
]
  .map((parts) => `<p class="contact">${parts.join(' <span class="sep">·</span> ')}</p>`)
  .join("");

const keyResults = cvKeyResults
  .map((k) => `<span class="kr"><b class="kr-value${k.mark ? " hl" : ""}">${esc(k.value)}</b> <span class="kr-label">${esc(k.label)}</span></span>`)
  .join(" ");

const workItems = work.map((w) => item(esc(w.title), [w.org, w.period], bullets(w.cvBullets ?? w.bullets, w.cvMarks))).join("");

const cvProjects = pick(projects, CV_PROJECTS);
const projectMeta = (p: (typeof projects)[number]) => [p.context ?? p.category, p.year].filter((part): part is string => Boolean(part));

const featuredItems = cvProjects
  .slice(0, CV_FEATURED)
  .map((p) =>
    item(
      titleLink(p.links[0].href, p.title),
      projectMeta(p),
      `${bullets(p.cvBullets ?? [p.desc], p.cvMarks)}<p class="tech">${p.tags.slice(0, TECH_SHOWN).map(esc).join(" · ")}</p>`,
      p.cvTrack
    )
  )
  .join("");

// แถวสั้นเป็นย่อหน้าเดียว (run-in): ชื่อ — บริบท · ปี · หมวด. แล้ว cvShort ประหยัดบรรทัดจน Projects ทั้งหมดจบในหน้า 1
// cvShort เน้นวลีเดียวกับ cvBullets (`npm run check:data` ตรวจว่า cvMarks อยู่ใน cvShort ด้วย) ตัวเลขในแถวสั้นจึงเด่นเท่ารายการเต็ม
const moreItems = cvProjects
  .slice(CV_FEATURED)
  .map(
    (p) =>
      `<p class="row"><span class="title">${titleLink(p.links[0].href, p.title)}</span> <span class="meta">— ${projectMeta(p)
        .map(esc)
        .join(" · ")}${p.cvTrack ? ` <span class="track">· ${esc(p.cvTrack)}</span>` : ""}.</span> ${marked(p.cvShort ?? p.cvBullets?.[0] ?? p.desc, p.cvMarks)}</p>`
  )
  .join("");

// cvLeadership: กิจกรรมที่มีเฉพาะใน CV (ยังไม่อยู่บนเว็บ)
const leadershipItems = pick([...leadership, ...cvLeadership], CV_LEADERSHIP)
  .map((l) => item(esc(l.title), [l.org, l.period].filter(Boolean), bullets(l.cvBullets ?? l.bullets, l.cvMarks)))
  .join("");

const educationItems = education
  .map((e) =>
    item(esc(e.degree), [e.school, [e.period, e.graduation].filter(Boolean).join(" · ")], `<p class="body">Relevant coursework: ${e.coursework.map(esc).join(", ")}</p>`)
  )
  .join("");

const honorItems = `<ul>${[
  ...cvHonors.map(esc),
  ...certifications.map((c) => `${c.href ? titleLink(c.href, c.title) : esc(c.title)} — ${esc(c.issuer)}, ${esc(c.year)}`),
]
  .map((line) => `<li><span>${line}</span></li>`)
  .join("")}</ul>`;

const skillLines = cvSkills.map((g) => `<p><span class="label">${esc(g.title)}:</span> ${g.items.map((s) => `<span class="nowrap">${esc(s)}</span>`).join(", ")}</p>`).join("");

// K. จากไฟล์ต้นฉบับ logo (ไฟล์เดียวกับที่ `npm run og` อ่าน): ใช้ทั้งกลาง QR และ footer
const kMark = readFileSync(resolve(ROOT, "design/logo/k-serif.svg"), "utf8").match(/<path[^>]*\/>\s*<circle[^>]*\/>/)?.[0];
if (!kMark) throw new Error("ไม่พบ path/circle ของ K. ใน design/logo/k-serif.svg");
/**
 * K. ใน footer: margin box ของ @page จัดรูปด้วย CSS ไม่ได้ (ขนาด, vertical-align, margin) ทุกอย่างจึงอยู่ใน SVG
 * viewBox ครอปพอดีตัว K กับจุด (x 4–59, y 12–53 ใน k-serif.svg) ฐานของ K จึงวางบน baseline ของชื่อแบบ lockup ของเว็บ
 * ส่วนจุดเลยฐานลงไป 1 หน่วยเหมือน overshoot ของจุดจริง ต่อขวา 12 หน่วย (~1/4 ความสูง K ตามกติกาพื้นที่ว่าง) เป็นระยะห่างจากชื่อ
 * K สูง 9px ≈ ขนาดตัวอักษร 7pt (สัดส่วนเดียวกับ lockup) เล็กกว่าขั้นต่ำ 24px ของจอ แต่ใน PDF เป็น vector เส้นบางจึงยังคม
 */
const kFooterUri = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="15.1" height="9.2" viewBox="4 12 67 41">${kMark}</svg>`
).toString("base64")}`;

/**
 * QR ไป profile.siteUrl สร้างตอน build: เปลี่ยนโดเมนแล้ว QR ตามเอง สำหรับคนอ่านจากกระดาษ (aria-hidden ข้อความข้าง ๆ มีลิงก์จริง)
 * error correction H กู้ได้ราว 30% จึงเว้นกลาง 9×9 โมดูล (~10%) ให้ K. ได้ จุดสี pen ตาสามมุมสีหมึกเป็นกรอบมน
 * quiet zone 4 โมดูลเป็นพื้นขาวในตัว SVG สแกนได้แม้วางบนพื้นสี: แก้ส่วนนี้แล้วต้อง decode จาก PNG ที่ render จาก PDF ทุกครั้ง
 */
function qrSvg(text: string) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "H" });
  const n = modules.size; // ขนาดเป็นเลขคี่เสมอ (21, 25, 29, …) ช่องกลาง 9 โมดูลจึงอยู่กึ่งกลางพอดี
  const quiet = 4;
  const logo = 9;
  const lo = (n - logo) / 2;
  const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const inLogo = (r: number, c: number) => r >= lo && r < lo + logo && c >= lo && c < lo + logo;
  const dots = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (modules.get(r, c) && !inEye(r, c) && !inLogo(r, c)) dots.push(`<circle cx="${c + 0.5}" cy="${r + 0.5}" r="0.46"/>`);
  const eye = (x: number, y: number) =>
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.6" fill="none" stroke="#141b2b"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.8" fill="#141b2b"/>`;
  const side = n + 2 * quiet;
  return `<svg class="qr" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="${-quiet} ${-quiet} ${side} ${side}"><rect x="${-quiet}" y="${-quiet}" width="${side}" height="${side}" fill="#fff"/><g fill="#2343c4">${dots.join("")}</g>${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}<svg x="${lo + 1}" y="${lo + 1}" width="${logo - 2}" height="${logo - 2}" viewBox="0 0 64 64">${kMark}</svg></svg>`;
}

// สีมาจาก src/styles/tokens.css (โหมดสว่าง): ink, ink-muted, stroke, rule, paper, pen, marker, margin
// faint (3.5:1) ไม่ผ่าน AA กับข้อความเล็ก จึงใช้กับเส้นเท่านั้น ข้อความรองทุกตัวใช้ muted (7.5:1)
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(profile.name)} — CV</title>
<style>
${fontFaceCss(["Newsreader Static", "IBM Plex Sans Static"])}
/* footer เหมือนกันทุกหน้า (หน้า 1 ไม่ต่างจากหน้า 2) ใช้ margin box ของ @page ไม่ใช้ position:
   pdftotext ได้ footer ต่อท้ายเนื้อหาของหน้านั้นพอดี ขอบล่าง 16mm แล้ววางข้อความชิดบนของ margin box: ขอบล่างของตัวอักษรห่างขอบกระดาษราว 10.5mm */
@page { size: A4; margin: 12mm 15mm 16mm;
  @bottom-left { content: url("${kFooterUri}") "${esc(profile.name)} · ${esc(shortUrl(profile.siteUrl))}"; vertical-align: top; padding-top: 1.5mm;
    font: 7pt "IBM Plex Sans Static", sans-serif; color: #4b5568; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); vertical-align: top; padding-top: 1.5mm;
    font: 7pt "IBM Plex Sans Static", sans-serif; color: #4b5568; } }
/* ระยะห่างมี 4 ขั้นเท่านั้น: ระหว่าง bullet / หัวรายการ→เนื้อหา / ระหว่างรายการ / ก่อนหัว section */
:root { --s1: 1.5pt; --s2: 3pt; --s3: 7pt; --s4: 13pt;
  --ink: #141b2b; --muted: #4b5568; --faint: #7e899a; --rule: #d5dce6; --paper: #f2f5f9; --pen: #2343c4; --marker: #ffe566; --margin: #d9464e; }
* { box-sizing: border-box; margin: 0; padding: 0; }
p, li > span { text-wrap: pretty; }
html { font-family: "IBM Plex Sans Static", sans-serif; font-size: 8.6pt; line-height: 1.4; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
a { color: var(--pen); text-decoration: none; }
b, .title, .label { font-weight: 600; }
.sep { color: var(--muted); }
.nowrap { white-space: nowrap; }

header { display: flex; align-items: center; gap: 6mm; }
.who { flex: 1; }
h1 { font-family: "Newsreader Static", serif; font-size: 26pt; font-weight: 500; line-height: 1; letter-spacing: -0.012em; }
.headline { margin-top: var(--s2); font-family: "Newsreader Static", serif; font-style: italic; font-size: 11pt; color: var(--muted); }
.contact { font-size: 7.9pt; color: var(--muted); }
.headline + .contact { margin-top: var(--s2); }
.photo { flex: none; width: 21mm; height: 21mm; border-radius: 50%; object-fit: cover; border: 0.8pt solid var(--rule); }

/* Key results: แถบพื้นกระดาษอ่อน ค่าเป็น serif ตัวใหญ่ จุดที่สองที่สายตาเจอหลังชื่อ
   ตาราง 2×2: แต่ละช่องอ่านเป็น ค่า + ป้าย ตามลำดับ และแถวเดียวกันอยู่บรรทัดเดียวกันใน pdftotext */
.key-results { display: grid; grid-template-columns: 1fr 1fr; column-gap: 6mm; row-gap: var(--s1); margin-top: var(--s3); padding: var(--s2) 4mm; background: var(--paper); border-radius: 2px; }
.kr { white-space: nowrap; }
.kr-value { font-family: "Newsreader Static", serif; font-weight: 500; font-size: 12.5pt; }
/* ปากกาเน้นคลุมตัวอักษรเต็มความสูง (content area ของฟอนต์) เฉพาะค่าที่มี mark ใน data.ts
   margin ติดลบเท่า padding เฉพาะด้านซ้าย: ตัวเลขตรงแนวกับช่องที่ไม่มีไฮไลต์ ส่วนด้านขวาเหลือช่องว่างก่อนป้าย ขอบสองข้างจึงเท่ากัน */
.hl { background: var(--marker); padding: 0 2pt; margin-left: -2pt; border-radius: 1.5pt; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.kr-label { font-size: 7.8pt; color: var(--muted); }
.lede { margin-top: var(--s3); font-family: "Newsreader Static", serif; font-size: 9.6pt; line-height: 1.35; color: var(--muted); }

/* หัว section ไม่ใส่ letter-spacing: parser ของ ATS อ่านตัวอักษรที่ถ่างเป็น "S U M M A R Y" แล้วหา section ไม่เจอ
   break-after: หัว section ไม่ค้างอยู่ท้ายหน้าโดยไม่มีรายการตาม
   เส้นใต้หัวเป็น pseudo-element ไม่มีข้อความ: แดง 50mm แล้วต่อด้วยเส้น rule บางจนสุดความกว้าง
   ความหนาเป็น px เต็ม (2px = 1.5pt, 1px) เพราะ Chrome ปัดขอบกล่องลงพิกเซล ค่าเศษ (เช่น 1.2pt = 1.6px) ได้ 2px บ้าง 1px บ้างตามตำแหน่ง */
section { margin-top: var(--s4); }
h2 { font-family: "Newsreader Static", serif; font-weight: 500; font-size: 12.5pt; line-height: 1.1; break-after: avoid; }
h2::after { content: ""; display: block; height: 2px; margin-top: var(--s1);
  background: linear-gradient(var(--margin), var(--margin)) 0 0 / 50mm 2px no-repeat, linear-gradient(var(--rule), var(--rule)) 0 100% / 100% 1px no-repeat; }
h3 { margin-top: var(--s3); font-family: "Newsreader Static", serif; font-style: italic; font-weight: 500; font-size: 9.8pt; color: var(--muted); break-after: avoid; }
.item, .row, li { break-inside: avoid; }
/* hanging indent: บรรทัดที่ตัดลงไปเยื้องเข้า ชื่อแถวจึงเป็นจุดเริ่มที่ชัด */
.row { padding-left: 3.8mm; text-indent: -3.8mm; margin-top: var(--s2); }
.item { margin-top: var(--s3); }
h2 + .item, h3 + .row { margin-top: var(--s2); }
.meta { color: var(--muted); }
.track { font-size: 7.6pt; color: var(--muted); }
.title-link { white-space: nowrap; }
/* ห้ามใช้ position กับ li: Chrome จะวาด (และเขียนข้อความลง PDF) ทีหลังเนื้อหาอื่นทั้งหมด
   → ATS ที่อ่านข้อความตามลำดับใน PDF จะเห็น bullet หลุดไปอยู่ท้ายไฟล์ ขีดหน้า bullet จึงเป็นกล่อง flex ไม่ใช่ตัวอักษร */
ul { list-style: none; margin-top: var(--s1); }
li { display: flex; gap: 2mm; margin-top: var(--s1); }
li::before { content: ""; flex: none; width: 1.8mm; height: 1px; margin-top: 0.72em; background: var(--faint); }
.tech, .body { margin-top: var(--s1); }
.tech { font-size: 7.6pt; color: var(--muted); padding-left: 3.8mm; }
.skills p { margin-top: var(--s1); }
h2 + .skills p:first-child { margin-top: var(--s2); }
/* บัตรคำแบบการ์ดบนเว็บ: พื้นขาว ขอบ rule หัวเส้นแดง QR 24mm (โมดูลราว 0.65mm สแกนจากกระดาษได้สบาย ขั้นต่ำ ~20mm) */
.coda { display: flex; align-items: center; gap: 5mm; margin-top: var(--s4); padding: 3mm 4mm; break-inside: avoid;
  background: #fff; border: 1px solid var(--rule); border-top: 2px solid var(--margin); border-radius: 2px; }
.qr { flex: none; width: 24mm; height: 24mm; }
.cta { font-family: "Newsreader Static", serif; font-size: 11pt; }
.cta-url { margin-top: var(--s2); font-weight: 600; }
</style>
</head>
<body>
  <header>
    <div class="who">
      <h1>${esc(profile.name)}</h1>
      <p class="headline">${esc(profile.cvHeadline)}</p>
      ${contactLines}
    </div>
    <img class="photo" src="${cvPhotoDataUri()}" alt="" />
  </header>
  <p class="key-results">${keyResults}</p>

  <section><h2>Summary</h2><p class="lede">${esc(profile.cvSummary)}</p></section>
  <section><h2>Experience</h2>${workItems}</section>
  <section><h2>Projects</h2>${featuredItems}<h3>More projects</h3>${moreItems}</section>
  <section><h2>Leadership &amp; Teaching</h2>${leadershipItems}</section>
  <section><h2>Education</h2>${educationItems}</section>
  <section><h2>Honors &amp; Certifications</h2>${honorItems}</section>
  <section><h2>Skills</h2><div class="skills">${skillLines}</div></section>
  <div class="coda">${qrSvg(profile.siteUrl)}<div><p class="cta">Scan for live demos &amp; project write-ups</p><p class="cta-url">${titleLink(profile.siteUrl, shortUrl(profile.siteUrl))}</p></div></div>
</body>
</html>`;

// tech ของโปรเจกต์แสดงไม่ครบ keyword ทุกตัวจึงต้องอยู่ที่ใดที่หนึ่งใน CV (ส่วนใหญ่คือ Skills) ไม่งั้น ATS หาไม่เจอ
const plain = html
  .replace(/<style[\s\S]*?<\/style>/, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .toLowerCase();
const missing = [...new Set(cvProjects.flatMap((p) => p.tags))].filter((tag) => !plain.includes(tag.toLowerCase()));
if (missing.length) {
  console.error(`tag ไม่อยู่ในข้อความ CV: ${missing.join(", ")} — เพิ่มใน cvSkills ของ src/data.ts`);
  process.exit(1);
}

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
  // นับ object หน้าใน PDF (/Type /Page แต่ไม่ใช่ /Pages): ล้นหน้าแล้ว Chrome ไม่เตือนอะไร
  const pages = readFileSync(OUTPUT, "latin1").match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
  if (pages !== PAGES) {
    // ลบ hash เดิม: PDF บนดิสก์ตอนนี้คือฉบับที่ผิด รอบหน้าต้องสร้างใหม่เสมอ และ `--check` ใน CI แดงจนกว่าจะแก้
    rmSync(HASH_FILE, { force: true });
    console.error(
      pages > PAGES
        ? `CV มี ${pages} หน้า ต้องเป็น A4 ${PAGES} หน้า: ตัดท้าย ๆ ของ CV_PROJECTS (prim-visualizer, portfolio) หรือ CV_LEADERSHIP หรือย่อ cvBullets / cvShort`
        : `CV มี ${pages} หน้า ต้องเป็น A4 ${PAGES} หน้า: หน้า 2 ควรมีเนื้อหาอย่างน้อยราวครึ่งหน้า ห้ามขยายฟอนต์หรือระยะเพื่อถ่วงหน้า`
    );
    process.exit(1);
  }
  writeFileSync(HASH_FILE, `${hash}\n`);
  console.log(`CV → ${OUTPUT}`);
}
