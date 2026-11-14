import { PHOTO_SIZE, VIDEO_SIZE, experienceMedia } from "../config/experienceMedia";

/**
 * หา URL ของรูปจากชื่อไฟล์: mapping ใน src/config/*Media.ts เก็บแค่ชื่อ (สคริปต์ที่รันด้วย Node ต้อง import ได้)
 * ส่วนไฟล์นี้ให้ Vite ใส่ hash และ bundle รูปทุกไฟล์ในสองโฟลเดอร์ รูปที่ไม่ได้ใช้จึงไม่ควรวางทิ้งไว้ในนั้น
 */
const urls = import.meta.glob<string>("../assets/images/{experience,projects}/*/*.webp", { eager: true, import: "default" });

/**
 * ไฟล์อยู่ในโฟลเดอร์ย่อยตาม id ของรายการใน data.ts (`folder` = key ใน *Media.ts) รูปของรายการเดียวกันจึงอยู่ด้วยกัน
 * ไฟล์ใหญ่กว้าง `width` และไฟล์เล็กกว้างครึ่งหนึ่ง (ตามที่สคริปต์ photos / shots สร้าง)
 */
export function mediaSources(dir: "experience" | "projects", folder: string, name: string, width: number) {
  const url = (w: number) => urls[`../assets/images/${dir}/${folder}/${name}-${w}.webp`];
  return { src: url(width), srcSet: `${url(width / 2)} ${width / 2}w, ${url(width)} ${width}w` };
}

const videoUrls = import.meta.glob<string>("../assets/videos/*/*.mp4", { eager: true, import: "default" });

/** URL ของวิดีโอจากชื่อไฟล์ (ไม่รวม .mp4) ในโฟลเดอร์ของ id เดียวกับรูป */
const videoSource = (folder: string, name: string) => videoUrls[`../assets/videos/${folder}/${name}.mp4`];

/** รูป (และวิดีโอ) ของ id หนึ่งในรูปแบบที่แถบรูปและ Lightbox ใช้: หน้า explore ของโปรเจกต์เรียกใช้ด้วย */
export function fieldPhotos(id: string, role: string) {
  return (experienceMedia[id] ?? []).map((photo) => ({
    ...photo,
    ...PHOTO_SIZE,
    ...mediaSources("experience", id, photo.file, PHOTO_SIZE.width),
    video: photo.video ? { src: videoSource(id, photo.video), ...VIDEO_SIZE } : undefined,
    role,
  }));
}
