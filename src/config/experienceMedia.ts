/**
 * รูปกิจกรรมของแต่ละรายการใน Experience: key = id ของ timeline item ใน data.ts (หรือ id ของ certification ซึ่งแสดงในการ์ดของ Education)
 * key เป็น id ของ project ได้ด้วย (งานแข่ง): รูปขึ้นท้ายแถบ In the field และในหน้า explore ของโปรเจกต์นั้น
 * แยกจาก data.ts เพราะสคริปต์ CV รันไฟล์นั้นด้วย Node และรูปไม่ได้อยู่ใน CV
 * ไฟล์นี้เป็นข้อมูลล้วน (ไม่ import asset) สคริปต์ photos และ check:data จึง import ได้
 * `file` = ชื่อไฟล์ใน src/assets/images/experience/<key>/ (ไม่รวม -512/-1024.webp) ที่ `npm run photos` สร้าง
 * caption ห้ามมีชื่องาน วันที่ หรือจำนวนคนที่เจ้าของไม่ได้ยืนยัน
 */
export type ExperiencePhoto = {
  file: string;
  /** บรรยายสิ่งที่เห็นในรูปจริง */
  alt: string;
  caption: string;
  /**
   * ชื่อไฟล์ใน src/assets/videos/<key>/ (ไม่รวม .mp4) รูป `file` เป็นภาพปกในแถบ กดแล้ว lightbox เล่นวิดีโอ
   * วิดีโอไม่มีสคริปต์สร้าง: แปลงจากไฟล์ .MOV ของมือถือเองเป็น H.264 960×540 ราว 1 Mbps ไม่มีเสียง (HEVC เล่นไม่ได้ใน Firefox)
   */
  video?: string;
};

/**
 * ขนาดไฟล์ใหญ่ ไฟล์เล็กคือครึ่งหนึ่ง (สคริปต์กับ <img> ใช้ค่าเดียวกัน ความสูงที่จองไว้จึงตรงกับไฟล์เสมอ)
 * ทุกรูป 4:3 เท่ากัน: โพลารอยด์ในแถบ In the field จึงเป็นขนาดเดียว
 * กว้าง 1024 พอ: lightbox บนจอ 1440×900 แสดงรูป 4:3 ได้กว้างสุดราว 1000px และต้นฉบับบางรูปเล็กกว่านี้อยู่แล้ว
 */
export const PHOTO_SIZE = { width: 1024, height: 768 };

/** ขนาดของไฟล์วิดีโอ (16:9): lightbox ใช้คำนวณความกว้างกล่อง */
export const VIDEO_SIZE = { width: 960, height: 540 };

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
  "bki-scholarship": [
    {
      file: "bki-scholarship",
      alt: "Kulachart and a Bangkok Insurance representative holding a blue scholarship sign in front of a Bangkok Insurance backdrop",
      caption: "Receiving the Bangkok Insurance scholarship",
    },
  ],
  katang: [
    {
      file: "kbtg-orientation-group",
      alt: "A large group of participants and staff posing in rows in front of a screen reading KBTG KAMPUS Hackathon Orientation Day",
      caption: "Group photo on the hackathon's orientation day",
    },
    {
      file: "kbtg-register-side",
      alt: "Kulachart in glasses, a face mask and a navy shirt with a grey backpack, looking to the side while walking in",
      caption: "Checking in for the hackathon",
    },
    {
      file: "kbtg-mascot-1",
      alt: "Kulachart and teammates posing with two costumed KBTG mascots under a sign reading KBTG Kampus Hackathon Pitching Day",
      caption: "With the KBTG mascots on pitching day",
      video: "kbtg-mascot-1",
    },
    {
      file: "kbtg-auditorium-cheer",
      alt: "Participants raising their fists on tiered seating in an auditorium, with staff at desks with laptops in front and KBTG KAMPUS Hackathon banners behind",
      caption: "Participants and staff in the hackathon auditorium",
    },
  ],
};
