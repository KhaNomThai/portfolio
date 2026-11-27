import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import sharp from "sharp";
import { projectGallery, projectMedia } from "../src/config/projectMedia.ts";
import { profile, projects } from "../src/data.ts";
import { ROOT, esc } from "./lib/chrome.ts";

const dist = (file: string) => resolve(ROOT, "dist", file);
const read = (file: string) => readFileSync(dist(file), "utf8");
const meta = (html: string, name: string) => html.match(new RegExp(`<meta\\s+(?:name|property)="${name}"\\s+content="([^"]*)"`))?.[1];
const entities: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&lt;": "<", "&gt;": ">" };

const home = read("index.html");
const homeUrl = `${profile.siteUrl}/`;
const homeImage = `${homeUrl}og-image.png`;
assert.equal(meta(home, "og:url"), homeUrl, "index.html: og:url");
assert.equal(meta(home, "og:image"), homeImage, "index.html: og:image");
assert.ok(home.includes(`<link rel="canonical" href="${homeUrl}"`), "index.html: canonical");
assert.doesNotMatch(home, /<link rel="modulepreload"[^>]+ProjectPage-/);

const images = new Set([homeImage]);
const urls = [homeUrl];
const pages = [home];
for (const { id, title, desc } of projects) {
  const route = `projects/${id}`;
  const url = `${homeUrl}${route}`;
  const html = read(`${route}/index.html`);
  urls.push(url);
  pages.push(html);
  const expectedTitle = `${title} — ${profile.name}`;
  const shot = projectMedia[id] ?? projectGallery[id]?.find((image) => image.hero && !image.portrait);
  const image = shot ? `${url}/preview.jpg` : homeImage;
  images.add(image);
  for (const [name, expected] of Object.entries({
    description: desc,
    "og:url": url,
    "og:title": expectedTitle,
    "og:description": desc,
    "og:image": image,
    "og:image:alt": shot?.alt ?? `${profile.name} — ${profile.role}, ${profile.focus}`,
    "og:image:width": "1200",
    "og:image:height": "630",
  })) {
    assert.equal(meta(html, name)?.replace(/&(?:amp|quot|lt|gt);/g, (entity) => entities[entity]), expected, `${route}: ${name}`);
  }
  assert.ok(html.includes(`<title>${esc(expectedTitle)}</title>`), `${route}: title`);
  assert.ok(html.includes(`<link rel="canonical" href="${url}"`), `${route}: canonical`);
  assert.match(html, /<link rel="modulepreload"[^>]+ProjectPage-/, `${route}: preload Explore`);
  assert.ok(html.includes(`data-fallback-title>${esc(title)}</h1>`), `${route}: fallback title`);
  assert.ok(html.includes(`data-fallback-summary>${esc(desc)}</p>`), `${route}: fallback summary`);
  assert.ok(home.includes(`href="/${route}">${esc(title)}</a>`), `index.html: ลิงก์ ${route}`);
}

for (const image of images) {
  const { width, height, format } = await sharp(dist(new URL(image).pathname.slice(1))).metadata();
  assert.deepEqual([width, height, format], [1200, 630, image === homeImage ? "png" : "jpeg"], image);
}
assert.deepEqual([...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]), urls, "sitemap.xml");
assert.match(read("robots.txt"), /^User-agent: \*\nAllow: \/\n/m);
assert.ok(read("robots.txt").includes(`Sitemap: ${homeUrl}sitemap.xml`), "robots.txt: sitemap");
const notFound = read("404.html");
assert.equal(meta(notFound, "robots"), "noindex", "404.html");
assert.doesNotMatch(notFound, /rel="canonical"/);

const pdf = "/assets/Kulachart-Parnduangkeaw-CV.pdf";
assert.ok(readFileSync(dist(pdf.slice(1))).equals(readFileSync(resolve(ROOT, "src", pdf.slice(1)))), "PDF ใน dist ไม่ตรงกับต้นฉบับ");
for (const html of [...pages, notFound]) {
  assert.ok(html.includes(`href="${pdf}?download=1" download`), "HTML สำรองต้องดาวน์โหลด CV ได้");
}

// ข้อมูลเฉพาะ CV ต้องอยู่ใน PDF โดยไม่ซ้ำใน JavaScript ของเว็บ
for (const file of readdirSync(dist("assets")).filter((file) => file.endsWith(".js"))) {
  assert.doesNotMatch(read(`assets/${file}`), /\bcv(?:Headline|Summary|Bullets|Short|Track|Marks)\b/, file);
}
console.log(`ตรวจ HTML, ภาพ OG และ CV ใน dist ครบ ${urls.length} URL พร้อม sitemap, robots และ 404`);
