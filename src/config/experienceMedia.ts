/**
 * รูปกิจกรรมของแต่ละรายการใน Experience: key = id ของ timeline item ใน data.ts
 * แยกจาก data.ts เพราะสคริปต์ CV รันไฟล์นั้นด้วย Node และรูปไม่ได้อยู่ใน CV
 * ไฟล์นี้เป็นข้อมูลล้วน (ไม่ import asset) สคริปต์ photos และ check:data จึง import ได้
 * `file` = ชื่อไฟล์ใน src/assets/images/experience/ (ไม่รวม -512/-1024.webp) ที่ `npm run photos` สร้าง
 * caption ห้ามมีชื่องาน วันที่ หรือจำนวนคนที่เจ้าของไม่ได้ยืนยัน
 */
export type ExperiencePhoto = {
  file: string;
  /** บรรยายสิ่งที่เห็นในรูปจริง */
  alt: string;
  caption: string;
};

/**
 * ขนาดไฟล์ใหญ่ ไฟล์เล็กคือครึ่งหนึ่ง (สคริปต์กับ <img> ใช้ค่าเดียวกัน ความสูงที่จองไว้จึงตรงกับไฟล์เสมอ)
 * ทุกรูป 4:3 เท่ากัน: โพลารอยด์ในแถบ In the field จึงเป็นขนาดเดียว
 * กว้าง 1024 พอ: lightbox บนจอ 1440×900 แสดงรูป 4:3 ได้กว้างสุดราว 1000px และต้นฉบับบางรูปเล็กกว่านี้อยู่แล้ว
 */
export const PHOTO_SIZE = { width: 1024, height: 768 };

export const experienceMedia: Record<string, ExperiencePhoto[]> = {
  "cpe-student-leader": [
    {
      file: "student-leader-emcee",
      alt: "Kulachart in a reflective staff vest speaking into a microphone beside a floodlit sports field at night",
      caption: "Emceeing a university event",
    },
    {
      file: "student-leader-microbit",
      alt: "Kulachart in an engineering faculty shirt speaking into a desk microphone behind a laptop, with a tray of micro:bit kits on the table",
      caption: "Teaching micro:bit at a faculty activity",
    },
    {
      file: "student-leader-training",
      alt: "Kulachart in glasses and a navy shirt sitting among classmates, chin resting on hand, listening in a classroom",
      caption: "At a department training session",
    },
  ],
  "robotics-teaching-assistant": [
    {
      file: "robotics-ta-session",
      alt: "Kulachart leaning over a desk next to a seated high-school student, both looking down at the work in front of them",
      caption: "Helping high-school students in a robotics session",
    },
  ],
  "metaverse-presentation-assistant": [
    {
      file: "metaverse-booth-talk",
      alt: "Kulachart speaking into a microphone at a Srinakharinwirot University booth, with laptops showing a virtual campus in front",
      caption: "Speaking at a Metaverse training session",
    },
    {
      file: "metaverse-lab-assist",
      alt: "Kulachart standing in a computer lab beside a student working at a desktop computer",
      caption: "Assisting in a Metaverse class",
    },
  ],
};
