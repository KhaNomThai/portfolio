/**
 * แปลงรูปกิจกรรมจาก Picture/ เป็น WebP สองขนาดใน src/assets/images/experience/: `npm run photos`
 * อ่านต้นฉบับอย่างเดียว ไม่แก้ ย้าย หรือลบไฟล์ใน Picture/ (โฟลเดอร์นั้นไม่ได้ commit เพราะมีหน้าคนอื่นแบบไม่ crop)
 * รายการรูปและขนาดไฟล์มาจาก src/config/experienceMedia.ts ไฟล์นี้บอกแค่ว่าแต่ละรูปมาจากต้นฉบับไหนและ crop ตรงไหน
 * ทุกรูปเป็น 4:3 เท่ากัน: แถบ In the field วางโพลารอยด์ขนาดเดียวเรียงกัน
 * crop เน้นเจ้าของกับกิจกรรม และตัดหน้าคนอื่น ลายน้ำ กับป้ายชื่อออกเท่าที่ทำได้
 */
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { PHOTO_SIZE, experienceMedia } from "../src/config/experienceMedia.ts";
import { ROOT } from "./lib/chrome.ts";

const SOURCE_DIR = resolve(ROOT, "Picture");
const OUTPUT_DIR = resolve(ROOT, "src/assets/images/experience");
const QUALITY = 80;

/**
 * crop = [ซ้าย, บน, กว้าง, สูง] เป็นสัดส่วน 0–1 ของรูปหลังหมุนตาม EXIF จึงไม่ผูกกับความละเอียดของต้นฉบับ
 * gamma = ยกโทนกลางของรูปที่ถ่ายกลางคืน (1 = ไม่ปรับ): ฟ้ายังดำ แต่หน้าคนไม่จมเมื่อรูปถูกย่อ
 */
const SOURCES: Record<string, { source: string; crop: [number, number, number, number]; gamma?: number }> = {
  // ลายน้ำมุมขวาบนและป้ายชื่อ STAFF ด้านล่างอยู่นอกกรอบ
  "student-leader-emcee": { source: "university-event-emcee.jpg", crop: [0.207, 0.205, 0.56, 0.63], gamma: 1.3 },
  "student-leader-microbit": { source: "faculty-microbit-teaching.jpg", crop: [0.25, 0.07, 0.704, 0.792] },
  // ตัดแน่นที่เจ้าของ: หน้านักศึกษาซ้าย ขวาหน้า และแถวหลังอยู่นอกกรอบ ห้ามขยายกรอบ
  "student-leader-training": { source: "department-training.jpg", crop: [0.368, 0.29, 0.27, 0.303] },
  // เหลือเจ้าของกับนักเรียนที่นั่ง: นักเรียนอีกสองคนทางขวาอยู่นอกกรอบ ห้ามขยายกรอบไปทางขวา
  "robotics-ta-session": { source: "robotics-teaching-assistant.jpg", crop: [0.125, 0.258, 0.375, 0.4214] },
  "metaverse-booth-talk": { source: "metaverse-training.jpg", crop: [0.135, 0.34, 0.812, 0.457] },
  // คนใส่หน้ากากและแถวหลังทางขวาอยู่นอกกรอบ
  "metaverse-lab-assist": { source: "metaverse-teaching-assistant.jpg", crop: [0.15, 0.208, 0.662, 0.662] },
};

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const { file } of Object.values(experienceMedia).flat()) {
  const entry = SOURCES[file];
  if (!entry) throw new Error(`"${file}" อยู่ใน experienceMedia.ts แต่ไม่มีต้นฉบับใน SOURCES ของ build-photos.ts`);
  const input = resolve(SOURCE_DIR, entry.source);

  const meta = await sharp(input).metadata();
  // EXIF orientation 5–8 = รูปถูกหมุน 90° กว้าง/สูงที่เห็นจริงจึงสลับกับที่เก็บในไฟล์
  const [fullWidth, fullHeight] = (meta.orientation ?? 1) >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  const [left, top, width, height] = entry.crop;
  const region = {
    left: Math.round(left * fullWidth),
    top: Math.round(top * fullHeight),
    width: Math.round(width * fullWidth),
    height: Math.round(height * fullHeight),
  };

  for (const scale of [1, 0.5]) {
    const size = { width: Math.round(PHOTO_SIZE.width * scale), height: Math.round(PHOTO_SIZE.height * scale) };
    const output = resolve(OUTPUT_DIR, `${file}-${size.width}.webp`);
    // fit cover: ถ้าสัดส่วนของกรอบ crop ไม่ตรงทรงเป๊ะ ตัดขอบที่เกินแทนการบีบรูป
    const info = await sharp(input)
      .rotate()
      .extract(region)
      .resize({ ...size, fit: "cover" })
      .gamma(1, entry.gamma ?? 1)
      .webp({ quality: QUALITY })
      .toFile(output);
    if (info.width !== size.width || info.height !== size.height) {
      throw new Error(`${output} ได้ ${info.width}×${info.height} ต้องเป็น ${size.width}×${size.height}`);
    }
    console.log(`${file}-${size.width}.webp  ${(statSync(output).size / 1024).toFixed(0)} KB`);
  }
}
