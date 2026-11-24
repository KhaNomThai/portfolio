// import ผ่าน Vite → base path ถูกต้องอัตโนมัติ ชื่อไฟล์ไม่มี hash (ดู assetFileNames ใน vite.config.ts) จึงห้ามตั้ง cache แบบ immutable ให้ไฟล์นี้
// ตัว PDF สร้างจาก src/data.ts ด้วย `npm run cv` อย่าแก้ไฟล์ PDF ด้วยมือ
import cvUrl from "../assets/Kulachart-Parnduangkeaw-CV.pdf";

export const CV_URL = cvUrl;
export const CV_FILENAME = "Kulachart-Parnduangkeaw-CV.pdf";
