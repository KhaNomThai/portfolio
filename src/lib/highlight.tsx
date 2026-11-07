import type { CSSProperties, ReactNode } from "react";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** ระยะห่างระหว่างการขีดแต่ละครั้ง: เหมือนคนขีดทีละจุด ไม่ใช่พร้อมกันทั้งหมด */
const STAGGER_MS = 280;
const FIRST_DELAY_MS = 240;
/** ใน hero รอให้ชื่อเขียนเสร็จเกือบหมดก่อน (hero-letter) สายตาจะได้ไปที่ชื่อก่อนหลักฐาน */
export const HERO_MARK_DELAY_MS = 900;

/**
 * ครอบวลีที่กำหนดด้วย <mark> แล้วเล่นการขีดปากกาเน้นตอนโหลดหน้า (utility mark-swipe ใน index.css)
 * วลีต้องเป็นข้อความที่อยู่ใน text จริง — ถ้าหาไม่เจอ (เช่นแก้ summary แล้วลืมแก้ summaryMarks) จะเตือนใน dev
 */
export function highlightPhrases(text: string, phrases: readonly string[] = [], seen?: boolean): ReactNode[] {
  if (import.meta.env.DEV) {
    for (const phrase of phrases) {
      if (!text.includes(phrase)) console.warn(`highlightPhrases: ไม่พบ "${phrase}" ในข้อความ`);
    }
  }
  if (phrases.length === 0) return [text];

  let markIndex = 0;
  return text.split(new RegExp(`(${phrases.map(escapeRegExp).join("|")})`)).map((part, i) => {
    if (!phrases.includes(part)) return part;
    const first = seen === undefined ? HERO_MARK_DELAY_MS : FIRST_DELAY_MS;
    const style: CSSProperties = { "--swipe-delay": `${first + markIndex++ * STAGGER_MS}ms` };
    // seen ไม่ได้ส่งมา = hero ที่ขีดตอนโหลด ถ้าส่งมา = ขีดตอนเลื่อนมาเห็น ด้วยจังหวะเดียวกับตัวเลขผลลัพธ์บนการ์ด
    if (seen !== undefined) style["--swipe-duration"] = "var(--duration-slow)";
    return (
      <mark key={i} className={seen === false ? "mark-pending" : "mark-swipe"} style={style}>
        {part}
      </mark>
    );
  });
}
