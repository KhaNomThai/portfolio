# AGENTS.md — Handoff ของโปรเจค portfolio

คู่มือส่งงานให้ AI agent ที่เข้ามาดูแล repo ต่อ
อ่านไฟล์นี้ก่อน แล้วอ่าน [CLAUDE.md](CLAUDE.md) (กฎของโปรเจคฉบับเต็ม) และ [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) (ก่อนแตะ UI) ถ้าสามไฟล์นี้ขัดกัน ให้ถือ CLAUDE.md เป็นหลักแล้วถามเจ้าของ

---

## 0. กฎเหล็ก 12 ข้อ (ถ้าอ่านได้แค่ส่วนเดียว อ่านส่วนนี้)

1. **ตอบเจ้าของเป็นภาษาไทยเสมอ** รวมถึงสรุปงานและคำถามท้ายงาน ศัพท์เทคนิค ชื่อไฟล์ และโค้ดใช้อังกฤษได้ เอกสารและ comment ในโค้ดเขียนภาษาไทย อธิบาย "ทำไม" ไม่เล่าว่าโค้ดเคยเป็นแบบไหน commit message เป็นภาษาอังกฤษขึ้นต้นด้วยกริยา (`Add …`, `Fix …`)
2. **push เข้า `main` = เว็บจริง https://kulac.dev deploy ทันที** (Vercel) ห้าม push โดยเจ้าของไม่ได้สั่ง ห้าม `git push --force` ห้ามเขียน git history ใหม่ และห้ามเปลี่ยน visibility ของ repo
3. **เนื้อหาหลักอยู่ใน `src/data.ts`** ทั้งเว็บและ PDF CV ใช้ไฟล์นี้ ห้ามเขียนข้อความเนื้อหาตายตัวใน component ค่าที่แสดงใน metadata และ HTML สำรองของหน้าแรกต้องตรงกับ `index.html`
4. **Codex ไม่มี hook ของ Claude Code**: ทุกครั้งที่แก้ `src/data.ts`, `scripts/build-cv.ts`, `scripts/lib/chrome.ts`, `scripts/assets/*` หรือ `design/logo/k-serif.svg` ต้องรัน `npm run cv` เอง แล้ว commit `src/assets/Kulachart-Parnduangkeaw-CV.pdf` คู่กับ `src/assets/cv.sha256` ไม่งั้น CI แดง
5. **ห้ามแต่งข้อมูล** ตัวเลข ชื่องาน วันที่ จำนวนคน บทบาท ต้องมีที่มา (repo/README/notebook ของเจ้าของ หรือเจ้าของยืนยัน) ห้ามวาดกราฟหรือตัวเลขขึ้นเองเป็นรูปของโปรเจกต์
6. **ห้ามใส่ข้อมูลส่วนตัวเพิ่ม** (ที่อยู่บ้าน ฯลฯ) ทั้งเว็บและ CV เพราะใครก็ดาวน์โหลด PDF ได้ repo เป็น public
7. **ใช้แต่ token ของ design system** class default ของ Tailwind (สี ขนาดตัวอักษร ฟอนต์ มุม เงา) ถูกปิดไว้ ใช้แล้ว**ไม่ error แต่ไม่มี CSS** ต้องรัน `npm run check:tokens`
8. **Framer Motion: ใช้ `m.*` ไม่ใช่ `motion.*`** (LazyMotion strict จะ throw) และห้าม animate property ที่ทำให้ layout เปลี่ยน
9. **CV ต้องเป็น A4 2 หน้าเป๊ะ** อ่านได้ด้วย ATS ตัวอักษรไม่ต่ำกว่า 7pt ขอบอย่างน้อย 10mm ห้ามขยายฟอนต์/ระยะเพื่อถ่วงหน้า
10. **ห้ามแก้ ย้าย หรือลบไฟล์ใน `Picture/`** (ต้นฉบับรูป ไม่ commit มีหน้าคนอื่น)
11. **ห้ามเปิดหรืออ้างไฟล์ในโฟลเดอร์ Botnoi ของเจ้าของ** (ติด NDA) ดูหัวข้อ 12
12. ก่อนส่งงานให้รัน lint, token, data, CV hash, build และ `npm run test:smoke` หลัง build ตามคำสั่งในหัวข้อ 3 ถ้าแก้ UI ต้องเปิดดูจริงทั้งโหมดสว่าง มืด และความกว้างมือถือ

---

## 1. โปรเจคนี้คืออะไร

- Portfolio + resume ส่วนตัวของ **Kulachart Parnduangkeaw** (นักศึกษา Computer Engineering ปี 3, Srinakharinwirot University (SWU), คาดว่าจบ 2028) สายที่หา: **Data Science & ML · Full-Stack** (`availability`: "Open to Data, AI/ML & full-stack internships")
- เว็บจริง: **https://kulac.dev** (Vercel, preset Vite, build `npm run check:release`, output `dist/`) push เข้า `main` เริ่ม deploy ทันทีและจะเผยแพร่เมื่อ build ผ่าน
- Repo: https://github.com/KhaNomThai/portfolio (public, เปลี่ยนชื่อจาก `resume-site` เมื่อ 2026-11-09 และ GitHub redirect ชื่อ repo เดิม)
- โฟลเดอร์ในเครื่อง: `~/Documents/GitHub/portfolio` (ย้ายออกจาก iCloud แล้วเพราะ iCloud ทำไฟล์หายเป็น stub ห้ามย้ายกลับ)
- โดเมนซื้อผ่าน Cloudflare Registrar, DNS อยู่ Cloudflare แบบ **DNS only (ไม่ proxy)** ชี้ไป Vercel `www.kulac.dev` และ `kulachart-resume-site.vercel.app` redirect มาที่ `kulac.dev` URL GitHub Pages เก่า (`khanomthai.github.io/resume-site`) เป็น 404 แล้ว
- อีเมลติดต่อบนเว็บ/CV: `kulachart@kulac.dev` เป็น Cloudflare Email Routing ส่งต่อเข้า Gmail ของเจ้าของ (**รับอย่างเดียว** ส่งออกจาก Gmail) ห้ามตั้ง "Send mail as" ผ่าน smtp.gmail.com เพราะ DMARC `p=reject` จะ bounce SPF ตอนนี้คือ `include:_spf.mx.cloudflare.net ~all` (มีได้ SPF เดียว)
- เป้าหมายของเว็บ: recruiter สแกน 5–30 วินาทีแล้วรู้ว่าเป็นใคร ทำอะไร หางานอะไร และเห็นหลักฐาน (ตัวเลขที่ถูกขีดปากกาเน้น) ทันที ส่วน CV เป็น PDF 2 หน้าที่สร้างจากข้อมูลชุดเดียวกัน

## 2. ตรวจสถานะก่อนเริ่มงาน

- ใช้ `git status` ผล CI และสถานะ Production ของ commit ที่กำลังตรวจเป็นหลัก
- ยืนยันเมื่อ 27 พฤศจิกายน 2026 ว่า Portfolio เวอร์ชัน `4a98142` ขึ้น Vercel แล้ว และ [CI ผ่าน 65/65 เคส](https://github.com/KhaNomThai/portfolio/actions/runs/45994861822) ตรวจเว็บจริงแล้วว่าลิงก์ตรงทั้ง 10 โปรเจกต์เปิดได้ ดาวน์โหลด CV ได้ตรงกับไฟล์ใน repo และหน้า HTML สำรองทำงานเมื่อ JavaScript หลักโหลดไม่ได้
- เดโม [TangLat (Prim)](https://khanomthai.github.io/project-cpe101/) อยู่ใน [repo `project-cpe101`](https://github.com/KhaNomThai/project-cpe101) ซึ่ง deploy จาก `main` ผ่าน GitHub Pages ยืนยัน [เวอร์ชัน `5745001`](https://github.com/KhaNomThai/project-cpe101/actions/runs/45994416201) ว่ามีข้อความแนะนำสำหรับกราฟว่างและกราฟที่ยังเชื่อมไม่ครบ รวมถึงคำนวณกราฟที่เชื่อมครบได้
- ตรวจ Safari 27.2 บน Mac กับ build ในเครื่องแล้วสำหรับ Explore, Esc, การคืน focus และวิดีโอ ตรวจหน้าตา Safari บน iOS Simulator 27.2 เพิ่มด้วย รุ่นขั้นต่ำ Safari 16.4 และเสียงประกาศจาก VoiceOver ยังต้องยืนยัน
- ข้อมูลที่เจ้าของตัดสินแล้วอยู่ในหัวข้อ 11 ส่วนงบรูปและวิดีโออ้างจาก `MEDIA_BUDGET_KB` ใน `scripts/check-data.ts`

## 3. Tech stack และสภาพแวดล้อม

- React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS v4 (`@tailwindcss/vite`) + Framer Motion 12 (ผ่าน `LazyMotion`)
- ฟอนต์ self-host: Newsreader (variable, แกน opsz) + IBM Plex Sans (variable) จาก `@fontsource-variable/*` สำหรับเว็บ ส่วน CV ใช้ไฟล์ static จาก `@fontsource/*` (devDependencies) เพราะ Chrome ฝัง variable font ลง PDF เป็น Type3 ที่ ATS บางตัวอ่านไม่ได้
- devDeps ที่สคริปต์ใช้: `sharp` (แปลงและตรวจรูป), `qrcode` (QR ใน CV), `mp4box` (ตรวจ metadata วิดีโอ)
- **Node 22.18+** (`.nvmrc` = 22, `engines` >=22.18) เพราะสคริปต์ใน `scripts/` เป็น `.ts` ที่รันด้วย `node` ตรง ๆ (type stripping) เครื่องเจ้าของตอนนี้เป็น Node 26
- **Google Chrome** สำหรับ `cv`, `og`, `shots` (headless) ถ้าไม่อยู่ที่ default ตั้ง `CHROME_PATH` ถ้า sandbox ของคุณไม่มี Chrome ให้บอกเจ้าของว่ารัน `npm run cv` ไม่ได้ อย่า commit data.ts ที่ PDF ไม่ตรง
- `npm run shots` ต้องต่อเน็ต (เปิดหน้า demo จริง)
- Playwright เปิด build จาก Vite preview ที่ `127.0.0.1:4189` เอง Chrome ใช้จอ 320×568 และ 1280×800 ทั้งสองธีม WebKit ใช้จอสัมผัสจำลอง 375×812 โหมดมืด และ Firefox ใช้จอเดสก์ท็อปโหมดสว่าง ทุกชุดตั้ง reduced motion ยกเว้น Chrome เดสก์ท็อปโหมดมืดที่ทดสอบ motion ปกติ

### คำสั่ง

```bash
npm install
npm run dev           # http://localhost:5173 (ถ้าพอร์ตไม่ว่าง Vite ขยับไป 5174)
npm run build         # type-check, build และตรวจ HTML, OG, sitemap, 404 และ CV ใน dist/
npm run preview       # เสิร์ฟ dist/ ที่ :4173
npx playwright install webkit firefox
npm run check:release # lint, tokens, data, CV hash และ build
npm run test:smoke    # หลัง build ใช้ Playwright เปิด dist/
npm run lint          # eslint
npm run check:tokens  # หา class default ของ Tailwind ที่ token ปิดไว้
npm run check:data    # ตรวจความสอดคล้องของข้อมูล/รูป (รายละเอียดหัวข้อ 9)
npm run cv            # สร้าง PDF CV 2 หน้า → src/assets/Kulachart-Parnduangkeaw-CV.pdf + cv.sha256
npm run cv -- --check # เทียบ hash เท่านั้น ไม่ต้องมี Chrome (CI ใช้)
npm run og            # สร้าง public/og-image.png (1200×630)
npm run photos        # แปลงรูปกิจกรรมจาก Picture/ → src/assets/images/experience/<id>/*.webp
npm run shots         # จับ screenshot หน้า demo → src/assets/images/projects/<id>/*.webp (`-- <id>` เพื่อจับบางอัน)
```

### CI (`.github/workflows/ci.yml`)

รันทุก push และ PR บน Ubuntu ใช้ Node จาก `.nvmrc` แล้วรัน `npm ci` → `check:release` → ติดตั้ง WebKit กับ Firefox → `test:smoke` ก่อน push ตามที่เจ้าของสั่งให้รัน `npm run check:release && npm run test:smoke` ในเครื่อง Vercel ใช้ `check:release` เป็นด่าน build ก่อนเผยแพร่ ส่วนผล Playwright อยู่ใน GitHub Actions

### ของเฉพาะ Claude Code ที่ Codex ไม่มี

- `.claude/hooks/regen-cv.sh`: hook PostToolUse ใช้ `jq` อ่านพาธไฟล์เพื่อรัน `npm run cv` อัตโนมัติเมื่อ Claude แก้ไฟล์ที่มีผลต่อ CV → **Codex ต้องรันเอง** (กฎเหล็กข้อ 4)
- `.claude/launch.json`: config `dev` (5173) และ `preview` (4173) สำหรับ browser pane
- `.claude/settings.json`: allowlist คำสั่ง และ deny `git push --force` / `-f` (ถือเป็นกฎของโปรเจคด้วย)
- `CLAUDE.md` คือกฎของโปรเจค ไม่ใช่ของ Claude อย่างเดียว ใช้กับ Codex เต็ม ๆ

---

## 4. แผนที่ไฟล์

```
index.html                  # meta/OG/JSON-LD, HTML สำรอง และสคริปต์ตั้งธีมก่อนวาดหน้า
vite.config.ts              # preloadFonts และ projectPages สร้าง HTML/OG ต่อโปรเจกต์
vercel.json                 # rewrite หน้า Explore และ header ดาวน์โหลด CV เมื่อมี ?download=1
src/
├── data.ts                 # เนื้อหาหลักของเว็บและ CV ใช้กับ Node ได้โดยตรง
├── main.tsx                # LazyMotion strict + MotionConfig reducedMotion="user" + ErrorBoundary + แก้ focus ของ Safari
├── App.tsx                 # วางหน้าแรกและ dialog จัดการ ⌘K/Ctrl+K และจังหวะ mount หน้าแรก
├── index.css               # base styles + utility ตกแต่ง (mark-swipe, timeline-node, margin-line, surface-sheen ฯลฯ)
├── styles/tokens.css       # design tokens ทั้งหมด (+ ค่าโหมดมืดตาม data-theme)
├── config/
│   ├── sections.ts         # SECTIONS (id+label) ใช้ร่วม navbar, ⌘K, scroll-spy + TOP_ID="top"
│   ├── skillFamilies.ts    # skill/tag → หมวด (ml, data, stack, lang) ไม่อยู่ในตาราง = Tools
│   ├── skillLogos.ts       # path logo แบรนด์ (Simple Icons) แยก chunk
│   ├── experienceMedia.ts  # รูป/วิดีโอกิจกรรม key = id ใน data.ts (PHOTO_SIZE 1024×768, VIDEO_SIZE 960×540)
│   └── projectMedia.ts     # screenshot case study + projectGallery (SHOT_SIZE 1280×800, PORTRAIT_SIZE 800×1280)
├── sections/               # HeroSection, ProjectsSection, ExperienceSection, SkillsSection, EducationSection, ContactSection
├── components/             # ProjectPage (explore dialog), ProjectParts, LabFigure, CommandPalette, Navbar, Footer, Lightbox (+PlayBadge),
│                           # Toast (ToastProvider), Section, SkillLogo, SkillMarker, MarkedText, CountUp, Logo, NewTabHint,
│                           # BackToTop, MediaImage, ErrorBoundary, BrokenPage, icons
├── lib/                    # route.ts (router), theme.ts, projectFilter.ts, media.ts, highlight.tsx, prim.ts, clipboard.ts, cv.ts (CV_URL),
│                           # links.ts (isExternal), platform.ts (PALETTE_SHORTCUT), toast.ts, topDialog.ts, motionFeatures.ts,
│                           # useActiveSection, useCardTilt, useCopyEmail, useInViewOnce
├── types/css.d.ts          # type ของ CSS custom properties ใน style
└── assets/
    ├── Kulachart-Parnduangkeaw-CV.pdf + cv.sha256   # สร้างโดย npm run cv (commit คู่กันเสมอ)
    ├── images/profile/                               # รูปโปรไฟล์ (profile-640.webp ใช้ใน OG ด้วย)
    ├── images/experience/<id>/                       # รูป 4:3 (-1024/-512.webp)
    ├── images/projects/<id>/                         # screenshot/gallery 16:10 (-1280/-640) หรือ portrait 10:16 (-800/-400)
    └── videos/<id>/                                  # mp4 H.264 ไม่มีเสียง
scripts/
├── build-cv.ts             # สร้าง CV (CV_PROJECTS, CV_FEATURED=4, TECH_SHOWN=4, CV_LEADERSHIP)
├── build-og.ts             # สร้าง og-image (สีคัดลอกจาก tokens.css ไว้ในไฟล์นี้)
├── build-photos.ts         # SOURCES: ชื่อต้นฉบับใน Picture/ + crop [x,y,w,h] สัดส่วน 0–1 + gamma
├── build-shots.ts          # จับหน้า demo (เฉพาะ id ใน projectMedia ที่มี demo และไม่ manual) ภาพสีเดียว = ไม่เขียนทับ + exit 1
├── check-data.ts           # ตรวจข้อมูล (หัวข้อ 9)
├── check-tokens.ts         # ตรวจ class ต้องห้าม
├── lib/chrome.ts           # ROOT, runChrome, renderWithChrome, FONTS (ฟอนต์ static ของ CV), cvPhotoDataUri, esc, fontFaceCss
└── assets/cv-photo.jpg     # รูปใน CV
tests/portfolio.spec.ts     # smoke tests ของ build ที่ serve ผ่าน Vite preview
playwright.config.ts        # โปรไฟล์ Chrome, Firefox, WebKit และ local server
design/logo/                # ต้นฉบับ logo Serif K. (ไม่ build เข้าเว็บ) ห้ามลบ k-serif.svg (cv/og อ่าน)
public/                     # favicon-32.png, favicon.svg, apple-touch-icon.png, og-image.png
Picture/                    # ต้นฉบับรูป ไม่ commit (.gitignore) ห้ามแตะ
```

---

## 5. สถาปัตยกรรมของเว็บ

### ลำดับหน้า

Hero (`#top`) → Projects → Experience → Skills → Education → Contact (ตาม `SECTIONS`) แต่ละ section ห่อ `ErrorBoundary` แยกกัน section ไหนพังหน้าอื่นยังอยู่ ถ้าทั้งแอปพังแสดง `BrokenPage`

### Router และหน้า explore (`src/lib/route.ts`, `src/components/ProjectPage.tsx`)

- router เล็กที่เขียนเอง (ไม่มี library) มีแค่หน้าแรกกับ `/projects/<id>` ผ่าน `useSyncExternalStore` + `popstate`
- Explore โหลดแยกเมื่อเปิดโปรเจกต์ครั้งแรก ถ้า chunk โหลดไม่สำเร็จ ลิงก์ตรงยังแสดง HTML สำรองและดาวน์โหลด CV ได้
- Explore ใช้ `<dialog>.showModal()` เต็มจอ เมื่อคลิกจากหน้าแรกจะเก็บหน้าแรกไว้เพื่อคืนตำแหน่งเลื่อนและ focus เดิม เมื่อเปิดลิงก์ตรง แอปจะ mount หน้าแรกเมื่อออกจาก Explore เพื่อให้โหลดเนื้อหาของโปรเจกต์ก่อน
- `navigate()` และตัวรับ `popstate` ใน `App` ปิด Palette กับ Lightbox ผ่าน `closeAuxiliaryDialogs()` ก่อนเปลี่ยนปลายทาง ส่วน CSS ล็อกการเลื่อนหน้าเบื้องหลังจนกว่าจะปิด dialog ทั้งหมด
- `navigate(url, { replace, transition })` ใช้ `flushSync` และ View Transitions API ถ้าเบราว์เซอร์รองรับและไม่ได้ปิด motion state `{ fromHome: true }` บอกว่าปิดด้วย `history.back()` ได้ ถ้าเปิดลิงก์ตรงจะ replace เป็นหน้าแรกแล้วพาไปหัว Projects
- `goTo(id)` เลื่อนไป section แล้ว focus ที่หัวข้อหรือ element ใน `focusId` สำหรับกรองผ่าน Skills หรือ Palette ใช้ `showProjectsByTag()` เพื่ออัปเดตผลก่อน focus ที่สรุป ส่วน `jumpToEvidence(section, itemId)` กระโดดไปการ์ด `evidence-<id>` พร้อมกรอบแดงชั่วคราว (`data-spotlight` 1.6 วิ) ถ้าการ์ดถูกซ่อนจะเปิดหน้า explore แทน
- pager ก่อน/ถัดไปแบบวนรอบ และคีย์ลัด ←/→
- เนื้อหาเพิ่มอยู่ใน `explore` ของแต่ละโปรเจกต์ (overview, role, features, howItWorks, decisions) **ทุกข้อต้องมีที่มาใน README/docs ของ repo หรือ notebook ของเจ้าของ** และ `role` ห้ามเกินที่ `desc`/`context`/`cvBullets` บอก
- path ใหม่นอก `/projects/:id` ต้องเพิ่ม rewrite ใน `vercel.json`

### Prerender (`vite.config.ts` → plugin `projectPages`)

- `index.html` มี `#site-fallback` แสดงชื่อ สรุป ช่องทางติดต่อ และลิงก์ CV ก่อน React พร้อมใช้งาน แอปเอาส่วนนี้ออกเมื่อแสดงหน้าแรกหรือ Explore แล้ว
- ตอน build `projectPages` เติมรายการโปรเจกต์ใน HTML สำรองของหน้าแรก สร้าง `dist/projects/<id>/index.html` พร้อม title, canonical, description, Open Graph และสรุปของแต่ละโปรเจกต์ รวมถึง `sitemap.xml`, `robots.txt` และ `404.html` ที่มี `noindex` รูปแบบแท็กที่ plugin ค้นหาใน `index.html` ต้องคงเดิมเพื่อให้แทนค่าได้
- โปรเจกต์ที่มีภาพหลักใน `projectMedia` หรือภาพแนวนอน `hero: true` ใน `projectGallery` ได้ `dist/projects/<id>/preview.jpg` ขนาด 1200×630 งานอื่นใช้ `public/og-image.png` ใน link preview
- `writeBundle` ใช้ `runnerImport` โหลดข้อมูลเพื่อเลี่ยง dev server restart เมื่อแก้เนื้อหา ส่วน `preloadFonts` ใส่ preload ฟอนต์ subset latin ตอน build

### ธีม (`src/lib/theme.ts`, สคริปต์ใน `index.html`)

`data-theme` บน `<html>` เป็นแหล่งความจริงเดียว สคริปต์ inline ใน `index.html` ตั้งค่าก่อนวาดหน้า (กัน flash) ปุ่มใน navbar กับคำสั่งใน ⌘K สลับค่าเดียวกัน token ทุกตัวเปลี่ยนตาม `data-theme` จึง**ไม่ต้องเขียน `dark:`** ยังมีโหมดตารางพิมพ์เขียว `data-blueprint` ที่เปิดจาก ⌘K

### Motion

- `main.tsx`: `LazyMotion` (strict, โหลด feature แบบ dynamic import จาก `lib/motionFeatures.ts`) + `MotionConfig reducedMotion="user"`
- Framer ใช้เฉพาะของที่เกิดหลังการกด (toast, ตัวกรองโปรเจกต์, hero track lens, สลับมุมมอง skill) fade-in และของตกแต่งเป็น CSS (scroll-driven ถ้าเบราว์เซอร์รองรับ) เนื้อหาจึงยังเห็นแม้ chunk ของ framer โหลดไม่ได้
- animate ได้แค่ transform, opacity, filter, background, stroke ที่วาด ห้ามขยับ layout
- ทุกอย่างต้องเคารพ `prefers-reduced-motion`

### Sections และ component สำคัญ

- **HeroSection**: มือถือวางลิงก์ KBTG Top 30 และ Derma AI ไว้ใกล้ปุ่ม CV เพื่อเปิดหลักฐานได้จากจอแรก ลำดับสแกน ชื่อ → ตำแหน่ง → งานที่หา → หลักฐาน (ขีดเน้นจาก `summaryMarks`) → ปุ่ม → แถบตัวเลข `highlights` (กดแล้ว `jumpToEvidence`) intro sequence ราว 3.5 วิ (ชื่อเขียนทีละตัว → ปากกาเน้นขีด `HERO_MARK_DELAY_MS = 900` → ลายมือแดงวง availability → ลายเซ็นมุมรูป) มี `heroTracks` 3 สาย (ml / data / stack อย่างละ 3 รายการ) ใน HeroTrackLens, `heroTelemetry` (ขนาด dataset), พิกัดตาราง/เส้น decision boundary, รูปติดเทปที่เอียงตามเมาส์ (`useCardTilt`) screen reader ได้ชื่อเต็มทันที
- **ProjectsSection**: 2 มุมมอง `showcase` (bento การ์ด) กับ `ledger` (ตารางตามปี) ตัวกรองหลักเป็นหมวด skill (ไม่รวม Languages) ตัวกรอง Technology แสดง tag ที่มีอย่างน้อย 2 โปรเจกต์และ tag ที่เลือกจาก Skills หรือ Palette แถบเลื่อนให้เห็น chip ที่เลือก ส่วน Clear filter ล้างผลกรอง สถานะอยู่ใน `ProjectFilterContext` โปรเจกต์ที่มี key ใน `projectMedia` เป็น case study เต็มแถวพร้อม screenshot ที่ไม่มีเป็นแถวใน "More projects" การ์ดมี problem → approach → result (ถ้ามี) หรือ `desc`, `LabFigure` และ `FilmstripPeek` (แถบรูปจาก gallery ของโปรเจกต์ที่ไม่มี labFigure) มือถือแสดงการ์ด 4 ใบแรก ชื่อการ์ดเป็น stretched link ไปหน้า explore
- **LabFigure** (`kind`: `models`, `benchmark`, `dumbbell`, `gauge`, `mst`): กราฟ/เครื่องจำลองโต้ตอบได้ ตัวเลขทุกตัวมาจาก `labFigure` ใน `data.ts` component ใส่แค่ป้าย UI ลำดับ Prim คำนวณจริงด้วย `lib/prim.ts` (ไม่เก็บใน data) ปุ่มเล็ก 28px แต่พื้นที่กดยืดด้วย `::after` ถึง 44px อยู่ `z-10` เหนือ stretched link
- **ExperienceSection**: timeline แบบสมุด (วันที่ซ้าย เนื้อหาขวา จุด `timeline-node` ติดสีปากกาเมื่อผ่านกลางจอ ด้วย CSS ล้วน) + แถบรูป "In the field" แบบโพลารอยด์เอียง (รูปจาก `experienceMedia` เรียงตาม timeline ตามด้วยรูปงานแข่งของโปรเจกต์) จำนวนคอลัมน์จอ xl เลือกให้หารจำนวนรูปลงตัว `Lightbox` รองรับ ←/→, เปิดภาพขนาดเต็ม เล่นวิดีโอพร้อม poster และแสดง Try again เมื่อโหลดสื่อไม่สำเร็จ รูปตัวอย่างใช้ `MediaImage` เพื่อคงสัดส่วนและให้ลองโหลดได้ก่อนเปิด Lightbox
- **SkillsSection**: มุมมอง `index` (ดัชนีท้ายเล่ม: ชื่อ ..... จำนวนโปรเจกต์ที่ใช้ ไม่มี progress bar %) กับ `graph` (Skill ↔ Project matrix) กด skill แล้วเห็นหลักฐาน (`skillEvidence` ใช้คำอธิบายเฉพาะทักษะก่อน แล้วหาใน decisions → howItWorks → features) และกรองโปรเจกต์ได้ การชี้ทักษะอื่นขยับเส้นเชื่อมชั่วคราว แผงหลักฐานและปุ่มกรองยึดทักษะที่กดเลือก กด Back จากผลกรองจะคืน focus ให้ปุ่มเดิม logo แบรนด์โหลดเป็น chunk แยก
- **EducationSection**: ปริญญา + certifications/scholarship เป็นบัตรคำ
- **ContactSection**: อีเมล (คัดลอกได้ ตัดบรรทัดหลัง @ ด้วย `<wbr>`), LinkedIn, GitHub, phone
- **CommandPalette** (⌘K / Ctrl+K): ไปทุก section, ค้นโปรเจกต์และ skill, คัดลอกอีเมล, ดาวน์โหลด CV, เปิด GitHub/LinkedIn, สลับธีม, โหมด blueprint ใช้ `<dialog>`
- **Toast** (`ToastProvider`) live region ที่ย้ายเข้า dialog ที่เปิดอยู่ (`topDialog`)
- `main.tsx` มีโค้ดแก้ Safari: focus ปุ่ม/ลิงก์ตอนคลิกเพื่อให้ dialog คืน focus ถูก และ blur วง focus เมื่อปิดด้วย pointer

---

## 6. Data model (`src/data.ts`)

ใช้ type annotation ไม่ใช้ `as` ห้าม import asset ของ Vite (สคริปต์ CV รันไฟล์นี้ด้วย Node)

| export | ใช้ที่ | หมายเหตุ |
|---|---|---|
| `profile` | เว็บ + CV + OG | name, firstName, lastName, role, school, focus, availability, location, photoCaption, phone, email, github (`KhaNomThai`), linkedin (`kulac`), siteUrl, summary, mobileSummary, seoDescription, socialDescription, `summaryMarks` |
| `cvProfile` | CV | `cvHeadline` และ `cvSummary` |
| `cvDetails` | CV | `cvBullets`, `cvMarks`, `cvTrack` และ `cvShort` จับคู่โปรเจกต์หรือกิจกรรมด้วย id |
| `cvKeyResults` | CV | ตอนนี้: Top 30 KBTG (mark), Top 24 NTT DATA (mark), 0.89 AUC-ROC, ~300 runners — `mark: true` ไม่เกิน 2 อัน |
| `cvHonors` | CV | มี href ไปใบเซอร์ KBTG (`kbtgCertificateUrl` ใช้ร่วมกับปุ่ม Certificate ของ KaTang) |
| `cvSkills` | CV | แยกจาก `skillGroups` ใส่เฉพาะของที่มีหลักฐานหรือเจ้าของยืนยัน |
| `githubUrl`, `linkedinUrl`, `repoUrl` | เว็บ + CV | derived |
| `sectionIntros` | เว็บ | บรรทัดนำของ section |
| `contacts` | เว็บ | linkedin / github / phone |
| `skillGroups` | เว็บ | ML / DL, Data, Full-stack, Languages, Tools ตัวเลขข้าง skill = จำนวนโปรเจกต์ที่ใช้ (นับจาก tags) |
| `projects` | เว็บ + CV + prerender | ดูตารางด้านล่าง |
| `highlights` | เว็บ + OG (3 อันแรก) | แถบใต้ hero มี `target` ให้กระโดด `countUp: false` สำหรับอันดับ |
| `heroTracks`, `heroTelemetry` | เว็บ | |
| `work` | เว็บ + CV | `botnoi-data-science-intern` (Botnoi Group, May – Jul 2026) |
| `leadership` | เว็บ + CV | `cpe-student-leader`, `robotics-teaching-assistant`, `metaverse-presentation-assistant` |
| `cvLeadership` | CV เท่านั้น | `research-poster-assistant` (ยังไม่ขึ้นเว็บ) |
| `certifications` | เว็บ + CV | `bki-scholarship` (Bangkok Insurance, kind scholarship), `google-cloud-genai` |
| `education` | เว็บ + CV | `swu-cpe` (2024 – 2028 expected) |

**field ของ Project**: `id`, `title`, `category`, `year?`, `context?` (วิชา/งานแข่ง/ขนาดทีม), `desc` (ต้องมีเสมอ CV และ meta description ใช้), `problem?`/`approach?`/`result?`, `metric?` (เฉพาะค่าที่วัดจริง), `marks?` (วลีขีดเน้น 1 จุดต่อการ์ด ต้องตรงตัวอักษร), `tags` (ชื่อตรงกับ skill), `links` (อย่างน้อย 1, CV ลิงก์ไปหน้า Explore; kind: code/demo/notebook/certificate), `labFigure?`, `explore?`, `skillEvidence?` ข้อความเฉพาะ PDF อยู่ใน `cvDetails` โดยใช้ id เดียวกัน

**โปรเจกต์ปัจจุบัน (ลำดับบนเว็บ)**

| id | ชื่อ | บริบท |
|---|---|---|
| `katang` | KaTang Cash-flow Co-pilot | KBTG KAMPUS Hackathon 2026 · Team of 3 · Top 30 (screenshot manual, มีวิดีโอ) |
| `wellync` | WELLYNC | NTT DATA Digital Innovation Challenge 2026 · Team of 3 · Top 24 (screenshot manual, หน้าแรกของ demo คือ login) |
| `skin-cancer-screening` | Derma AI: Skin Cancer Screening | CPE310 Healthcare AI · Solo · 0.89 AUC-ROC (labFigure models: ResNet50 / DenseNet121 / EfficientNet-B3) |
| `peak-electricity-alert` | Peak Electricity Day Alert | CPE312 DS capstone (labFigure benchmark: XGBoost / baseline / logreg) |
| `smart-flood-ai` | Smart Flood AI | DOH Hackathon 2026 · Team of 3 (labFigure gauge) |
| `swu-run-checker` | SWU Run Together 2026 | SWU Athletics Club · Team of 2 · ~300 runners |
| `brainfit` | BrainFit | Client project · Team of 5 (mobile, gallery portrait) |
| `employment-gap-analysis` | Employment Data Gap Analysis | CPE260 research (labFigure dumbbell) |
| `prim-visualizer` | Prim's Algorithm Visualizer | CPE101 · labFigure MST และลิงก์ไปเดโม TangLat บน GitHub Pages |
| `portfolio` | This Portfolio | เว็บนี้เอง |

---

## 7. CV PDF (`scripts/build-cv.ts`)

- ภาพรวมทุกสาย (AI / Data, Web, Mobile, Leadership & Teaching) **A4 2 หน้าเป๊ะ** สคริปต์ fail ถ้าไม่ใช่ 2 หน้า และตรวจขนาดจากไฟล์ชั่วคราว เก็บ PDF และ hash เดิมไว้เมื่อสร้างหรือ validate ไม่ผ่าน
- **หน้า 1 ต้องยืนได้เอง** (recruiter อาจอ่านแค่หน้าแรก) เห็นทั้งงาน AI และ dev, **Projects ทั้งหมดอยู่หน้า 1** หน้า 2 ต้องมีเนื้อหาราวครึ่งหน้าขึ้นไป สคริปต์ไม่ตรวจข้อนี้ → **render PNG แล้วเปิดดูทุกครั้งที่แก้**
- เลือกรายการด้วย id: `CV_PROJECTS` = katang, wellync, skin-cancer-screening, peak-electricity-alert, smart-flood-ai, swu-run-checker, brainfit, employment-gap-analysis, prim-visualizer, portfolio `CV_FEATURED = 4` อันแรกเป็นรายการเต็ม (bullet + tech 4 ตัวแรก) ที่เหลืออยู่ใต้ "More projects" เป็นแถวสั้น ≤2 บรรทัดจาก `cvShort` (ไม่มี = `cvBullets[0]`) `CV_LEADERSHIP` = cpe-student-leader, robotics-teaching-assistant, metaverse-presentation-assistant, research-poster-assistant
- ถ้าล้นเป็น 3 หน้า: ตัดท้าย `CV_PROJECTS` (prim-visualizer, portfolio) หรือ `CV_LEADERSHIP` ก่อน หรือย่อ `cvBullets`/`cvShort` **ห้าม**ลดฟอนต์ต่ำกว่า 7pt, ขอบต้อง ≥10mm, ห้ามขยายฟอนต์/ระยะเพื่อถ่วงหน้า
- tag ที่บรรทัด tech ไม่ได้แสดงต้องอยู่ใน `cvSkills` ไม่งั้น `npm run cv` fail และบอกชื่อ tag
- **สีใน CV มีหน้าที่ละอย่าง**: น้ำเงิน pen = ตัวอักษรของสิ่งที่กดได้ (ไม่มีเส้นใต้) · พื้นเหลือง = เฉพาะ `cvKeyResults` ที่ `mark: true` · `cvMarks` = ตัวหนาสีหมึก (ต้องตรงตัวอักษรใน `cvBullets` และ `cvShort`, check:data ตรวจ) · แดง = เส้นตกแต่งเท่านั้น · ข้อความรองใช้ muted ห้ามใช้ faint (ไม่ผ่าน AA)
- **ATS**: คอลัมน์เดียว, วันที่อยู่บรรทัดเดียวกับชื่อรายการ (ไม่จัดชิดขวา), หัว section ไม่มี letter-spacing, ห้ามใช้ `position` กับ `li`, ห้ามวางรูป/ไอคอนระหว่างชื่อกับวันที่ (parser ตัดบรรทัด) หลังแก้ต้องดึงข้อความจาก PDF ตรวจลำดับ (เช่น `pdftotext` หรือ PyMuPDF)
- เส้นทุกเส้นหนาเป็น px เต็ม (1px, 2px) เพราะ Chrome ปัดเศษตามตำแหน่ง
- หัว section `break-after: avoid`, รายการ `break-inside: avoid` footer (K. + ชื่อ · kulac.dev / Page x of 2) ใช้ margin box ของ `@page` (`@bottom-left`, `@bottom-right`)
- QR ท้ายหน้า 2 สร้างจาก `profile.siteUrl` ด้วย `qrcode` (error correction H, K. ตรงกลางจาก `design/logo/k-serif.svg`) แก้ QR แล้วต้อง render PDF เป็น PNG แล้ว decode ว่ายังได้ URL ถูก
- น้ำหนัก/สไตล์ฟอนต์ใหม่ใน CV ต้องเพิ่มใน `FONTS` ของ `scripts/lib/chrome.ts`
- **hash**: `cv.sha256` เก็บ SHA-256 ของ HTML ต้นทางและไฟล์ PDF หากทั้งคู่ตรงกันจะใช้ PDF เดิม CI ใช้ `--check` เทียบสองค่าได้โดยไม่เปิด Chrome
- วิธีตรวจด้วยตา (ตัวอย่าง): `pdftoppm -r 80 -png src/assets/Kulachart-Parnduangkeaw-CV.pdf /tmp/cv` แล้วเปิดดูทั้งสองหน้า + `pdftotext -layout` ตรวจลำดับข้อความ

## 8. OG image, รูป และวิดีโอ

### OG (`npm run og` → `public/og-image.png`)

รันใหม่เมื่อแก้: `profile` (firstName, lastName, focus, role, school, availability, siteUrl), 3 อันแรกของ `highlights`, รูป `src/assets/images/profile/profile-640.webp`, หรือสีใน `tokens.css` (สีคัดลอกไว้ใน `scripts/build-og.ts` ต้องแก้ตามด้วย) ค่าใน `index.html` ต้องตรงกับ `data.ts` (check:data ตรวจ) รูป OG ของแต่ละโปรเจกต์สร้างใน `npm run build` จากภาพหลักที่เลือกไว้

### รูป

- mapping อยู่ใน `src/config/experienceMedia.ts` และ `src/config/projectMedia.ts` (ข้อมูลล้วน ไม่ import asset) key = id ใน `data.ts` ไม่มี key = ไม่มีรูป `src/lib/media.ts` ให้ Vite bundle ทุกไฟล์ในโฟลเดอร์ จึงห้ามวางไฟล์ที่ไม่ได้ใช้
- **รูปกิจกรรม (4:3)**: วางต้นฉบับใน `Picture/` → เพิ่มชื่อไฟล์ + crop ใน `SOURCES` ของ `scripts/build-photos.ts` (รูปมืดใส่ `gamma`) → เพิ่ม `file`, `alt`, `caption` ใน `experienceMedia.ts` → `npm run photos` → เปิดดูผล
- **screenshot โปรเจกต์ (16:10)**: มี demo → เพิ่ม id + `alt` ใน `projectMedia` แล้ว `npm run shots -- <id>` ไม่มี demo หรืออยากได้หน้าที่ต้องกด/เลื่อน → วาง `<id>-1280.webp` (1280×800) + `<id>-640.webp` เองใน `src/assets/images/projects/<id>/` และใส่ `manual: true` (KaTang, WELLYNC เป็นแบบนี้) **เปิดดู screenshot ทุกครั้ง** สคริปต์รู้แค่ว่าหน้าเปล่าไหม ไม่รู้ว่าเป็นหน้า login/error
- key ใน `projectMedia` = โปรเจกต์กลายเป็น case study บนหน้าแรก ส่วน `projectGallery` (ใน `projectMedia.ts`) เป็นรูปเพิ่มในหน้า explore ไม่ทำให้เป็น case study `hero: true` = รูปใหญ่บนสุดของหน้า explore (Prim, Smart Flood) `portrait: true` = หน้าจอมือถือ 10:16 ไฟล์ `-800/-400.webp` (BrainFit) รูปไม่ใช่ 16:10 ให้ต่อขอบพื้นหลัง อย่า crop เนื้อหาทิ้ง กราฟใช้ contain บนพื้นขาว ไม่ตัดป้ายแกน screenshot ใหญ่บนสุดกดแล้วเปิด demo เสมอถ้ามีลิงก์
- รูปจากงานแข่งของโปรเจกต์ใส่ใน `experienceMedia.ts` ด้วย id ของโปรเจกต์ (ขึ้นทั้งแถบ In the field และหน้า explore) ไฟล์อยู่ `images/experience/<project-id>/`
- จำนวนคอลัมน์ของ gallery/แถบ In the field เลือกให้หารจำนวนรูปลงตัว จำนวนเฉพาะ (7, 11) จะเหลือแถวไม่เต็ม
- **วิดีโอ**: `.mp4` H.264 ไม่มีเสียง ~1 Mbps 960×540 ใน `src/assets/videos/<id>/` ใส่ `video` ในรายการของ `experienceMedia.ts` รูป `file` คือภาพปก (เฟรมจากวิดีโอที่วางใน `Picture/`) ไฟล์ HEVC จากมือถือเล่นใน Firefox ไม่ได้ ต้องแปลง ตอนนี้มีวิดีโอเดียว (`videos/katang/kbtg-mascot-1.mp4` 30fps ราว 518 KB และใช้ fast start)
- caption/alt ห้ามมีชื่องาน วันที่ หรือจำนวนคนที่เจ้าของไม่ได้ยืนยัน alt บรรยายสิ่งที่เห็นในรูปจริง
- รูปที่มีหน้าคนอื่นชัด (โดยเฉพาะนักเรียน) ต้องให้เจ้าของขออนุญาตก่อนขึ้นเว็บ (ยกเว้นที่อนุมัติแล้ว ดูหัวข้อ 11)
- กราฟจาก notebook ต้องรันบน Linux (Colab หรือ Docker) ไม่ใช่ macOS เพราะตัวเลข XGBoost/RandomForest ต่างเล็กน้อย (ดูหัวข้อ 12)

## 9. ด่านตรวจ (`scripts/check-data.ts`) ตรวจอะไรบ้าง

- skill/tag ทุกตัวมีหมวดใน `skillFamilies.ts` หรืออยู่กลุ่ม Tools
- `summaryMarks` อยู่ใน `profile.summary`, `marks` ของแต่ละรายการอยู่ในข้อความของรายการนั้น, `cvMarks` อยู่ในข้อความที่ CV ใช้
- ชื่อหน้า, canonical, description, Open Graph, JSON-LD และชื่อ สรุป กับลิงก์ติดต่อใน HTML สำรองตรงกับ `data.ts`
- สื่อใช้ id ที่มีจริง ไฟล์ครบและอยู่ใน mapping ตรวจการ decode และขนาด WebP, metadata MP4 H.264 960×540 ไม่มีเสียง รวมถึง alt/caption ที่ต้องมี งบรวมของโฟลเดอร์รูปโปรเจกต์ รูปกิจกรรม และวิดีโอเท่ากับ 4800 KB
- ตรวจ tag และ id ของโมเดลไม่ซ้ำ ช่วงแกนของ dumbbell ลำดับเกณฑ์ gauge และกราฟ MST ที่เชื่อมครบด้วย vertex ที่มีจริง มี test ของ `primOrder` และข้อมูลกราฟที่ผิดรูปแบบ
- `target` ของ highlights/heroTracks และ `projectId` ใน heroTracks มีอยู่จริง
- `check:build` ตรวจ title, canonical, OG และ HTML สำรองทุกโปรเจกต์ รวมถึง sitemap, robots, 404 และ PDF ใน `dist/`

`check-tokens.ts` สแกน `src/` (ยกเว้น `tokens.css` และ `assets/`) กับ `index.html` หา: สี palette default/`white`/`black`, สี arbitrary ที่อยู่ในกฎ, ขนาดอักษร arbitrary ที่กำหนดหน่วยโดยตรง, `text-xs…9xl`, `font-mono`, `rounded-sm…4xl`, `shadow-xs…2xl`

---

## 10. Design system (สรุป อ่านฉบับเต็มใน DESIGN_SYSTEM.md)

- แนว **Lab Notebook**: หน้าสมุดของนักศึกษาวิศวะ กระดาษกราฟ (ช่อง 24px = gutter = line-height ของ body), เส้น margin สีแดง, บัตรคำ (เส้นแดงใต้ชื่อการ์ด) หมึกน้ำเงินดำ = สิ่งที่อ่าน, ปากกาน้ำเงิน (`pen`) = สิ่งที่กด, ปากกาเน้นเหลือง (`marker`) = ผลลัพธ์เท่านั้น (1 จุดต่อการ์ด) `::selection` เป็นสีปากกาเน้น
- token (`src/styles/tokens.css`): สี `paper`, `surface`, `ink`, `ink-muted`, `pen`, `pen-hover`, `on-pen`, `marker`, `on-marker`, `margin`, `rule`, `stroke`, `grid`, `grid-major`, `key`, `focus`, `glass`, `glow`, `sheen` · ขนาดตัวอักษร `text-12/14/16/18/21/24/36/48/60/72` และ type style `type-*` (1 class = 1 บทบาท เช่น `type-title`, `type-body`, `type-label`) · ฟอนต์ `font-serif` (Newsreader), `font-sans` (IBM Plex Sans) · มุม `rounded-tag/control/card` · เงา `shadow-overlay` (เฉพาะของที่ลอย) · `--target-min` 44px · container `page`, `measure`, `measure-lead` · motion `duration-fast/base/slow/intro`, `ease-in/out/in-out`
- หมวด skill บอกด้วยรูปทรง plot marker สีเดียว ● ■ ▲ ◆ (ไม่ใช้สีแยกหมวด) ลำดับตาม `SKILL_FAMILIES`
- ค่าที่ไม่มีใน token → **ถามเจ้าของก่อนเพิ่ม**
- เปลี่ยนฟอนต์/ไฟล์ฟอนต์ → คำนวณ `size-adjust` ของฟอนต์สำรองใน `tokens.css` ใหม่ และแก้ชื่อใน `preloadFonts` ของ `vite.config.ts` (ไม่งั้นเกิด CLS โดย build ยังผ่าน)
- logo **Serif K.** (`design/logo/k-serif*.svg`) กติกาอยู่หัวข้อ Logo ใน DESIGN_SYSTEM.md
- Accessibility ที่ต้องรักษา: semantic landmarks/headings, skip link, focus ring 2px ห่าง 2px, `NewTabHint` สำหรับลิงก์เปิดแท็บใหม่, คอนทราสต์ AA ทั้งสองโหมด (ข้อความ 4.5:1, ขอบ control/focus 3:1), สีไม่เป็นช่องทางเดียว (ลิงก์มีเส้นใต้), ตัวเล็กสุด 12px, บรรทัดไม่เกิน ~66 ตัว, พื้นที่กด ≥44px (ยกเว้นปุ่ม skill ในมุมมอง Graph 32px), `prefers-reduced-motion`
- โหมดมืดแนว "Obsidian lab" (glow/sheen เป็นของตกแต่งเท่านั้น) โหมดสว่างเป็นแนวสมุดเดิม
- ประวัติการตัดสินใจ: Phase 1 เลือกแนว A Lab Notebook (ยืม legend จากแนว C), Phase 2 เลือก logo Serif K., Phase 3 โหมดมืด Obsidian + Projects bento + Ledger, Phase 4 Lab Figures, highlights กระโดดไปหลักฐาน, FilmstripPeek, View Transitions, Skills Graph, ⌘K ค้นครบ + blueprint

---

## 11. การตัดสินใจของเจ้าของที่ปิดแล้ว (ห้ามถามซ้ำหรือ flag อีก)

- **ไม่ใส่ตัวเลขของงาน Botnoi และไม่แสดง GPA** (2026-11-10) `TODO` สองจุดใน `data.ts` ไม่ใช่งานค้าง ห้ามแต่งตัวเลข เครื่องมือที่ Botnoi = Python ทั่วไป (เจ้าของบอก 2026-11-24)
- **ปัญหา security ใน repo ของเพื่อนร่วมทีม** (SWU Run ใช้ Google Sheet CSV สาธารณะ, WELLYNC `NEXT_PUBLIC_SWU_API_KEY`) เจ้าของรับรู้และปล่อยไว้ อย่ายกขึ้นมาอีกถ้าไม่ถูกถาม
- **รูปกลุ่ม KBTG ที่เห็นหน้าคนอื่น** (`kbtg-*` ใน experienceMedia) อนุมัติแล้ว (2026-11-14) กฎขออนุญาตยังใช้กับรูปใหม่อื่น ๆ
- **ปิดแล้ว 2026-11-24**: คำว่า "digital BIB" ของ SWU Run, บทบาทใน WELLYNC และ SWU Run, หลักฐาน Top 30 ของ KBTG (ใบเซอร์เขียน "participation" แต่ให้เฉพาะ 30 ทีมที่เข้ารอบ จึงใช้เป็นหลักฐานได้ ให้คงลิงก์ใน `cvHonors` และปุ่ม Certificate), เบอร์โทรบนเว็บ + CV, รูปที่เห็นหน้านักเรียนที่ขึ้นอยู่แล้ว
- **คงสมดุล DS + dev** (2026-11-24): เจ้าของไม่เอาการปรับให้เป็นสาย DS ล้วน ห้ามเรียงโปรเจกต์ใหม่เพื่อดัน WELLYNC ลง หรือเปลี่ยน "~300 runners" ใน `cvKeyResults` เป็น metric DS (เจ้าของมองว่าความสามารถ dev เป็นจุดบวก แม้มีสัมภาษณ์ DS ที่ KBTG) การแก้ความถูกต้อง/keyword ยังทำได้ตามปกติ
- **Smart Flood AI ทีม 3 คนจริง** (2026-11-25) คนที่สามทำฝั่ง business และเจ้าของไม่ต้องการใส่ชื่อ ให้คง "Team of 3" แม้ repo DOH_Hackathon จะมีแค่ 2 คน
- **ไฮไลต์ 31% vs 24% ของ employment-gap-analysis ถูกเอาออกโดยตั้งใจ** (ทั้ง marks และ cvMarks) ตัวเลขยังอยู่ในข้อความ ห้ามใส่ไฮไลต์กลับ
- **Employment Gap ทำต้นปี 2026** (ปีบนเว็บ = 2026) ทั้ง Employment Gap และ Peak เป็นงานกลุ่มในนามแต่เจ้าของทำคนเดียว จึงไม่ต้องใส่ขนาดทีม คำว่า "Market Reality" ที่ค้างใน Colab ของ Employment Gap ไม่เป็นไร
- **Figma** ใช้ออกแบบ UI ในหลายโปรเจกต์ (ไม่ระบุว่าโปรเจกต์ไหน อย่าเดาใส่โปรเจกต์ใด) **Unity** ใช้ในกิจกรรม metaverse
- **เรื่อง git history**: เจ้าของเลือก "ยังไม่ทำ" (2026-11-25) ห้ามเขียน history ใหม่หรือเปลี่ยน visibility ของ repo เว้นแต่เจ้าของสั่ง และห้ามคัดลอกข้อมูลส่วนตัวจาก commit เก่ามาใส่ที่ไหน

## 12. แหล่งที่มาของข้อมูลและตัวเลข

- ตัวเลขบนเว็บต้องตรงกับ repo/notebook สาธารณะ ลิงก์ Colab ใน `data.ts` คือตัวเลขที่เว็บอ้าง (ดาวน์โหลดด้วย `drive.google.com/uc?export=download&id=...`)
- notebook/poster ของ Peak อยู่ใน iCloud ของเจ้าของ: `Works/SWU/CPE/Year 3/Term 1/CPE312/DS Capstone Project` ข้อมูล Employment Gap: `Works/SWU/CPE/Year 2/Term 2/CPE260/Research Project`
- **รันกราฟ/ตัวเลขใหม่บน Linux เท่านั้น** (Docker: numpy 2.0.2, pandas 2.2.2, scikit-learn 1.6.1, xgboost 3.4.1) ผลที่ต้องได้: Peak TP 185 / FN 35 / FP 51, Employment 55.50% บน macOS recall ของ Peak ออกมา 83% (ซึ่งตรงกับโปสเตอร์ของเจ้าของ) แต่เว็บใช้ค่าจาก Linux/Colab
- **`Works/SWU/CPE/Year 2/Internship/BOTNOI` มี NDA และไฟล์ของลูกค้า ห้ามเปิดหรืออ้างอิง**
- `explore` ทุกข้อต้องอ้างได้จาก README/docs ของ repo โปรเจกต์ หรือ notebook ของเจ้าของ ถ้าไม่มีที่มา ไม่ต้องใส่

---

## 13. สูตรงานที่เจอบ่อย

**แก้เนื้อหา (ข้อความ/ตัวเลข)**
1. แก้ `src/data.ts` (ถ้าแก้ phrase ที่อยู่ใน `marks`/`summaryMarks`/`cvMarks` ต้องแก้คู่กัน)
2. `npm run cv` → ถ้ากระทบ OG (`profile` บางช่อง / 3 highlights แรก) `npm run og`
3. ถ้าแก้ title/description ที่ซ้ำใน `index.html` ให้แก้ `index.html` ให้ตรง (check:data จับ)
4. เปิด PNG ของ CV ดูทั้ง 2 หน้า + ดึงข้อความตรวจลำดับ
5. รันด่านตรวจทั้งหมด → commit data.ts + PDF + cv.sha256 (+ og-image.png) ด้วยกัน

**เพิ่มโปรเจกต์ใหม่**
1. เพิ่ม object ใน `projects` (id ไม่ซ้ำ, `desc`, `tags`, `links` อย่างน้อย 1) + เพิ่มรายการ id เดียวกันใน `cvDetails` ถ้าจะใช้ข้อความเฉพาะ CV
2. tag ใหม่ → เพิ่มใน `skillFamilies.ts` (และ `skillLogos.ts` ถ้าอยากมี logo) และพิจารณา `skillGroups` / `cvSkills`
3. ใส่ id ใน `CV_PROJECTS` ถ้าจะขึ้น CV แล้วตรวจว่ายัง 2 หน้าและ Projects จบในหน้า 1
4. screenshot/gallery ตามหัวข้อ 8
5. หน้า explore และ prerender ได้อัตโนมัติจาก `projects` (path `/projects/<id>` มี rewrite แล้ว)

**เพิ่ม skill**: `skillGroups` ใน data.ts + `skillFamilies.ts` (+ `skillLogos.ts`) ตัวเลขข้าง skill นับจาก tags ของโปรเจกต์ จึงเพิ่มชื่อที่ไม่มีโปรเจกต์ใช้ไม่ได้ ถ้าอยากให้อยู่แค่ใน CV ใส่ `cvSkills`

**แก้ UI**: อ่าน DESIGN_SYSTEM.md → ใช้ token เท่านั้น → `npm run check:tokens` → เปิด `npm run dev` ดูโหมดสว่าง/มืด, จอกว้างและมือถือ (~375px), ลองคีย์บอร์ด (Tab, Esc, ⌘K, ←/→ ในหน้า explore), และ reduced motion

**เปลี่ยนโดเมน**: แก้ `profile.siteUrl` ใน `data.ts` + canonical/og:url/og:image/JSON-LD ใน `index.html` → `npm run cv` (QR เปลี่ยน ต้อง decode ตรวจ) + `npm run og`

**พิสูจน์ว่า refactor ไม่เปลี่ยนหน้าตา**: build ฐาน (tag/commit เดิม) กับ HEAD ด้วย `npx vite build --outDir <tmp>/dist-x` เสิร์ฟแต่ละอันด้วย `python3 -m http.server` จับ screenshot เต็มความสูงด้วย headless Chrome (`--window-size=1440,7000` และ `375,9000`, เพิ่ม `--force-dark-mode` สำหรับโหมดมืด, `--virtual-time-budget=6000`) แล้ว diff ด้วย PIL `ImageChops.difference` **noise ที่ไม่ใช่การเปลี่ยนจริง**: ไฮไลต์ "0.89" บนการ์ด และเส้นใต้เมนู navbar (เวลาของ IntersectionObserver/animation ใน headless ไม่นิ่ง) ถ่ายซ้ำ 2–3 รอบก่อนสรุป ถ้าหน้าต่าง browser ถูกซ่อน IntersectionObserver ไม่ทำงาน mark ค้างเป็น `mark-pending` ไม่ใช่บั๊ก

## 14. กับดักที่เคยเจอ

- class Tailwind ที่ไม่มีใน token **ไม่ error** หน้าแค่ไม่มี style
- class ต้องเขียนเต็มให้ Tailwind เห็นตอน build ห้ามต่อ string จากตัวเลข (ExperienceSection ใช้ตารางของ class เต็มด้วยเหตุนี้)
- ห้ามใช้ regex lookbehind ในโค้ดฝั่งเว็บ: Safari ก่อน 16.4 โยน SyntaxError ส่วนขั้นต่ำของ CSS ตาม Tailwind v4 คือ Safari 16.4 ห้ามใช้ `checkVisibility` (Safari < 17.4) ใช้ `getClientRects().length` แทน
- `overflow-x-clip` (ไม่ใช่ `hidden`) ที่ root เพื่อไม่ตัดเนื้อหาตอนพิมพ์ มี print styles อยู่ อย่าทำให้พัง
- dialog ทุกตัว (ProjectPage, CommandPalette, Lightbox) ใช้ `<dialog>.showModal()` เพื่อได้ focus trap/Esc/inert ฟรี ถ้าสร้าง overlay ใหม่ให้ใช้แบบเดียวกัน toast ต้องย้ายเข้า dialog บนสุด (`topDialog`)
- `data.ts` ถูก import โดย Node script → ห้ามใช้ syntax/feature ที่ Node type-stripping ไม่รองรับ (enum, namespace, parameter properties) และห้าม import อะไรของ Vite
- PDF ไม่ใส่ hash ในชื่อไฟล์ตอน build (Vercel ส่ง content-disposition ตามชื่อไฟล์)
- พอร์ต 5173 อาจถูก dev server อื่นใช้อยู่ Vite จะขยับไป 5174
- `Picture/` อยู่ในเครื่องเจ้าของเท่านั้น ถ้า clone ใหม่จะไม่มี → `npm run photos` ใช้ไม่ได้ แต่ไม่จำเป็นถ้าไม่แก้รูป

## 15. Git และการส่งงาน

- ทำงานบน `main` มาตลอด (solo repo) ถ้างานใหญ่หรือเสี่ยงให้ถามเจ้าของว่าจะแตก branch/PR ไหม
- commit เมื่อเจ้าของสั่งเท่านั้น, ข้อความภาษาอังกฤษขึ้นต้นด้วยกริยา, ไม่ commit `.env*`, `.claude/settings.local.json`, `Picture/`, `dist/`
- commit PDF + `cv.sha256` คู่กันเสมอ และ `public/og-image.png` เมื่อรัน og
- หลัง push ที่เจ้าของสั่ง ให้ยืนยันว่าทั้ง Vercel Production และ CI ตรงกับ commit ที่ส่ง แล้วลองลิงก์โปรเจกต์โดยตรง การดาวน์โหลด CV และเส้นทางที่เพิ่งแก้บน `kulac.dev` ถ้าแก้เดโม TangLat ให้ตรวจ GitHub Pages ของ `project-cpe101` แยก เพราะ deploy คนละ repo
- สรุปงานให้เจ้าของเป็นภาษาไทย บอกตรง ๆ ว่าตรวจอะไรแล้ว อะไรยังไม่ได้ตรวจ ถ้าด่านไหนไม่ผ่านให้แปะผลจริง
