// แยกไฟล์ไว้ให้ main.tsx import แบบ dynamic: feature ของ framer-motion ถูกแยกเป็น chunk ที่โหลดหลังหน้าแรกแสดงแล้ว
// ใช้กับสิ่งที่เกิดหลังผู้ใช้กดเท่านั้น (toast, ตัวกรองโปรเจกต์, track lens, มุมมองของ Skills) ขาเข้าที่เริ่มจากโปร่งใสใช้ CSS (fade-in, rise-in) เสมอ: chunk นี้โหลดไม่ได้ เนื้อหาต้องยังเห็น
export { domAnimation as default } from "framer-motion";
