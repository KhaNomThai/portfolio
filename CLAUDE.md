# CLAUDE.md

Portfolio/resume ของ Kulachart (React 19 + TypeScript + Vite 7 + Tailwind v4 + Framer Motion) deploy บน Vercel ที่ https://kulac.dev ทุกครั้งที่ push เข้า `main` เว็บจริงจะ deploy ทันที

## คำสั่ง

```bash
npm run dev           # http://localhost:5173
npm run build         # tsc -b + vite build → dist/
npm run lint
npm run check:tokens  # หา class ค่า default ของ Tailwind ที่ token ปิดไว้ (lint/build จับให้ไม่ได้)
npm run check:data    # หา skill/tag ที่ไม่มีหมวด, summaryMarks ที่หาไม่เจอ, ค่าใน index.html ที่ไม่ตรงกับ data.ts, รูปที่ขาดหรือหนักเกินงบ
npm run cv            # สร้าง PDF CV → src/assets/Kulachart-Parnduangkeaw-CV.pdf (+ cv.sha256)
npm run og            # สร้างรูป link preview → public/og-image.png
npm run photos        # แปลงรูปกิจกรรมจาก Picture/ → src/assets/images/experience/*.webp
npm run shots         # จับ screenshot หน้า demo ของโปรเจกต์ → src/assets/images/projects/*.webp (ต่อท้าย `-- <id>` เพื่อจับบางอัน)
```

`cv`, `og`, `photos`, `shots`, `check:tokens` และ `check:data` รันไฟล์ `.ts` ด้วย Node ตรงๆ (ต้อง Node 22.18+) ส่วน `cv`, `og` และ `shots` ใช้ headless Google Chrome ถ้า Chrome ไม่อยู่ที่ default ให้ตั้ง `CHROME_PATH`

ก่อนบอกว่างานเสร็จ ให้รัน `npm run lint`, `npm run build`, `npm run check:tokens` และ `npm run check:data` ให้ผ่าน

## กฎที่ต้องจำ

- **เนื้อหาทั้งหมดอยู่ใน [src/data.ts](src/data.ts)** ทั้งเว็บและ PDF CV ใช้ไฟล์นี้ อย่าเขียนข้อความเนื้อหาตายตัวใน component (บรรทัดนำของ section อยู่ใน `sectionIntros`)
- แก้ `data.ts` แล้ว hook ใน `.claude/hooks/regen-cv.sh` จะรัน `npm run cv` ให้เอง ถ้าแก้ไฟล์นอก Claude Code ต้องรันเอง
- รัน `npm run og` ด้วยเมื่อแก้สิ่งที่อยู่ในรูป OG:
  - ช่อง `profile`: firstName, lastName, focus, role, school, availability, siteUrl
  - 3 อันแรกของ `highlights`
  - รูป `src/assets/images/profile/profile-640.webp`
  - สีใน `tokens.css` (สีในรูป OG คัดลอกไว้ใน `scripts/build-og.ts`)
- CV ต้องจบใน **A4 หน้าเดียว** (`npm run cv` fail ถ้าล้น) ถ้าเพิ่มเนื้อหาแล้วล้น ให้ลด `CV_PROJECTS` หรือ `LEADERSHIP_BULLETS` ใน `scripts/build-cv.ts` เนื้อหาที่ตัดออกยังอยู่บนเว็บ
- commit PDF คู่กับ `src/assets/cv.sha256` เสมอ CI รัน `npm run cv -- --check` เทียบ hash กับ data.ts ถ้าแก้ data.ts นอก Claude Code แล้วลืมรัน `npm run cv` CI จะแดง ส่วนตอนเนื้อหาไม่เปลี่ยน `npm run cv` จะไม่สร้าง PDF ใหม่ จึงไม่มี diff ที่ต่างแค่วันที่
- **ห้ามใส่ที่อยู่บ้านหรือข้อมูลส่วนตัวเพิ่ม** ทั้งในเว็บและ CV เพราะใครก็ดาวน์โหลด PDF ได้
- id และ label ของ section อยู่ที่ `src/config/sections.ts` ซึ่ง navbar, ⌘K palette และ scroll-spy ใช้ร่วมกัน
- URL ของเว็บเขียนตายตัวไว้ใน `index.html` (OG/JSON-LD) และ `src/data.ts` ถ้าโดเมนเปลี่ยนต้องแก้ทั้งสองที่
- skill หรือ tag ใหม่ใน `data.ts` ต้องเพิ่มใน `src/config/skillFamilies.ts` ด้วย ไม่อย่างนั้นถูกนับเป็น Tools (`npm run check:data` จับให้) ถ้าอยากให้มี logo ให้เพิ่มใน `src/config/skillLogos.ts`
- รักษา accessibility ที่มีอยู่: `prefers-reduced-motion`, skip link, focus state, hint สำหรับลิงก์ที่เปิดแท็บใหม่ (`NewTabHint`)
- Framer Motion โหลดผ่าน `LazyMotion` ให้ใช้ `m.*` ไม่ใช่ `motion.*` และห้าม animate property ที่ทำให้ layout เปลี่ยน

## รูป

รูปไม่อยู่ใน `data.ts` (สคริปต์ CV รันไฟล์นั้นด้วย Node) mapping อยู่ใน `src/config/experienceMedia.ts` และ `src/config/projectMedia.ts` โดยใช้ id จาก `data.ts` เป็น key รายการที่ไม่มี key ไม่มีรูป

- **เพิ่มรูปกิจกรรม**: วางต้นฉบับใน `Picture/` → เพิ่มชื่อไฟล์กับกรอบ crop ใน `SOURCES` ของ `scripts/build-photos.ts` → เพิ่ม `file`, `alt`, `caption` ใต้ id ของรายการใน `experienceMedia.ts` (ทุกรูป crop เป็น 4:3 เท่ากัน รูปที่มืดใส่ `gamma` ใน `SOURCES` ได้) → `npm run photos` แล้วเปิดดูไฟล์ที่ได้
- **เพิ่ม screenshot โปรเจกต์**: โปรเจกต์ที่มี screenshot แสดงเป็น case study เต็มแถว ที่ไม่มีเป็นแถวใน "More projects" ถ้ามีลิงก์ `demo` เพิ่ม id กับ `alt` ใน `projectMedia.ts` แล้วรัน `npm run shots -- <id>` ถ้าไม่มี demo หรืออยากได้หน้าที่ไม่ใช่หน้าแรก (ต้องกดหรือเลื่อนก่อน) วาง `<id>-1280.webp` (1280×800) กับ `<id>-640.webp` ใน `src/assets/images/projects/` เองแล้วเพิ่ม id พร้อม `manual: true` เพื่อไม่ให้ `npm run shots` จับทับ (KaTang และ WELLYNC เป็นแบบนี้)
- เปิดดู screenshot ที่จับได้ทุกครั้ง สคริปต์จับได้แค่หน้าเปล่า ไม่รู้ว่าเป็นหน้า login หรือหน้า error (หน้าแรกของ demo WELLYNC คือหน้า login)
- `Picture/` ไม่ commit (อยู่ใน `.gitignore`) เพราะต้นฉบับมีหน้าคนอื่นแบบไม่ crop ห้ามแก้ ย้าย หรือลบไฟล์ในนั้น รูปที่มีหน้าคนอื่นชัด โดยเฉพาะนักเรียน ต้องให้เจ้าของขออนุญาตก่อนขึ้นเว็บ
- ทุกไฟล์ใน `src/assets/images/experience/` และ `src/assets/images/projects/` ถูก bundle ขึ้นเว็บ อย่าวางรูปที่ไม่ได้ใช้ไว้ `npm run check:data` fail ถ้ารวมเกิน 1.5MB, id ไม่ตรงกับ `data.ts` หรือไฟล์ขาด
- caption และ alt ห้ามมีชื่องาน วันที่ หรือจำนวนคนที่เจ้าของไม่ได้ยืนยัน และห้ามวาดกราฟหรือตัวเลขขึ้นเองเป็นรูปของโปรเจกต์

## Design system

แนว **Lab Notebook** รายละเอียดและเหตุผลของทุก token อยู่ใน [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) อ่านก่อนแตะเรื่อง UI

- token ทั้งหมดอยู่ที่ `src/styles/tokens.css` (import ใน `src/index.css`) ค่า default ของ Tailwind ในหมวดสี ขนาดตัวอักษร ฟอนต์ มุม และเงา (เช่น `bg-indigo-500`, `text-sm`, `rounded-xl`, `shadow-lg`) ถูกปิดไว้จึง **ใช้ไม่ได้** ให้ใช้ utility จาก token (`text-ink`, `bg-surface`, `type-body`, `rounded-card` ฯลฯ) ถ้าค่าที่ต้องการไม่มีใน token ให้ถามก่อนเพิ่ม
- class ที่ไม่มีใน token **ไม่ error** Tailwind แค่ไม่สร้าง CSS lint/build จึงผ่านทั้งที่หน้าเว็บพัง ดังนั้นหลังแก้ UI:
  1. รัน `npm run check:tokens`
  2. เปิดดูใน browser pane ด้วย `.claude/launch.json` (`dev`) ทั้งโหมดสว่างและมืด และที่ความกว้างมือถือ
- โหมดมืดเปลี่ยนค่า token เองตาม `data-theme` บน `<html>` ไม่ต้องเขียน `dark:` ถ้าไม่จำเป็นจริง
- ถ้าเปลี่ยนฟอนต์หรือไฟล์ฟอนต์ ต้องคำนวณ `size-adjust` ของฟอนต์สำรองใน `tokens.css` ใหม่ และแก้ชื่อไฟล์ใน `preloadFonts` ของ `vite.config.ts` ไม่อย่างนั้นหน้าจะกระโดดตอนฟอนต์โหลด (CLS) โดยที่ lint/build ยังผ่าน
- logo คือ **Serif K.** (`design/logo/k-serif*.svg`) กติกาการใช้อยู่ในหัวข้อ Logo ของ DESIGN_SYSTEM.md ห้ามลบ `design/logo/k-serif.svg` เพราะ `npm run og` อ่านไฟล์นี้
- `design/logo/` เก็บไฟล์ต้นฉบับของ logo เท่านั้น ไม่ได้ถูก build เข้าเว็บ
- CV PDF มีดีไซน์ของตัวเองที่ใช้ฟอนต์ Geist แยกจากเว็บ จึงยังต้องมี `@fontsource-variable/geist` และ `geist-mono` ใน devDependencies

## เนื้อหาที่ยังรอข้อมูล

ข้อมูลที่เจ้าของต้องเติมเองมี `TODO` กำกับไว้ใน [src/data.ts](src/data.ts) (หาด้วย `git grep -n TODO -- src/data.ts`) ห้ามเดาหรือแต่งตัวเลขเอง

- `work`: ตัวเลขจริงใน bullet ของงานที่ Botnoi (ขนาด dataset, metric ก่อน/หลัง, จำนวนโมเดล) ถ้าเปิดเผยได้
- `education`: ใส่ GPA ถ้าอยากแสดง

## สไตล์งาน

- เอกสารและ comment ในโค้ดเขียนเป็นภาษาไทย อธิบายว่า "ทำไม" มากกว่า "ทำอะไร" และไม่เล่าว่าโค้ดเคยเป็นแบบไหน
- commit message เป็นภาษาอังกฤษ ขึ้นต้นด้วยกริยา เช่น `Wire tokens into index.css`
