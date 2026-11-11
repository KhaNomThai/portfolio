// แยกไฟล์ไว้ให้ main.tsx import แบบ dynamic: feature ของ framer-motion ถูกแยกเป็น chunk ที่โหลดหลังหน้าแรกแสดงแล้ว
// (ใช้แค่ toast, การจางตอนกรองโปรเจกต์ และรูปใน lightbox ซึ่งเกิดหลังผู้ใช้กดเท่านั้น)
export { domAnimation as default } from "framer-motion";
