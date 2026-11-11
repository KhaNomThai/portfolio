/**
 * หา URL ของรูปจากชื่อไฟล์: mapping ใน src/config/*Media.ts เก็บแค่ชื่อ (สคริปต์ที่รันด้วย Node ต้อง import ได้)
 * ส่วนไฟล์นี้ให้ Vite ใส่ hash และ bundle รูปทุกไฟล์ในสองโฟลเดอร์ รูปที่ไม่ได้ใช้จึงไม่ควรวางทิ้งไว้ในนั้น
 */
const urls = import.meta.glob<string>("../assets/images/{experience,projects}/*.webp", { eager: true, import: "default" });

/** ไฟล์ใหญ่กว้าง `width` และไฟล์เล็กกว้างครึ่งหนึ่ง (ตามที่สคริปต์ photos / shots สร้าง) */
export function mediaSources(dir: "experience" | "projects", name: string, width: number) {
  const url = (w: number) => urls[`../assets/images/${dir}/${name}-${w}.webp`];
  return { src: url(width), srcSet: `${url(width / 2)} ${width / 2}w, ${url(width)} ${width}w` };
}
