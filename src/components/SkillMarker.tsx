import type { ReactNode } from "react";
import { SKILL_FAMILIES, type SkillFamilyId } from "../config/skillFamilies";

/**
 * รูปทรงคือ marker เริ่มต้นของ matplotlib (o, s, ^, D) ที่คนสาย data เห็นในกราฟทุกวัน
 * วาดเอง (ไม่ใช้ตัวอักษร ● ■) เพราะแต่ละฟอนต์วาดสัญลักษณ์พวกนี้ขนาดไม่เท่ากัน
 * สามเหลี่ยมกับข้าวหลามตัดกินพื้นที่น้อยกว่าวงกลม จึงวาดให้ใหญ่ขึ้นนิดหนึ่ง ตาเห็นหนักเท่ากัน
 */
const SHAPES: Record<SkillFamilyId, ReactNode> = {
  ml: <circle cx="5" cy="5" r="4.5" />,
  data: <rect x="1" y="1" width="8" height="8" />,
  stack: <path d="M5 .4 9.8 9.3H.2Z" />,
  lang: <path d="M5 .2 9.8 5 5 9.8.2 5Z" />,
};

/**
 * สัญลักษณ์หมวด (ตกแต่ง) — ผู้เรียกต้องมีชื่อหมวดเป็นข้อความกำกับเสมอ
 * สี key: โหมดสว่างเป็นหมึกเดียวกับข้อความ โหมดมืดเป็นครามอ่อน แสง glow รอบรูปทรงเห็นชัดเฉพาะบนพื้นมืด
 * inherit: ใช้สีตัวอักษรของที่ครอบอยู่แทน (chip ที่กดแล้วพื้นเป็น pen สี key จะจมหาย)
 */
export default function SkillMarker({ family, inherit = false, className = "" }: { family: SkillFamilyId; inherit?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={`size-2.5 shrink-0 ${inherit ? "fill-current" : "fill-key [filter:drop-shadow(0_0_3px_var(--color-glow))]"} ${className}`}
    >
      {SHAPES[family]}
    </svg>
  );
}

/** legend ของสัญลักษณ์: อธิบายครั้งเดียว แล้วการ์ดและรายการ skill ใช้ต่อได้โดยไม่ต้องบอกซ้ำ */
export function SkillLegend({ className = "" }: { className?: string }) {
  return (
    <ul aria-label="Skill families" className={`flex flex-wrap gap-x-6 gap-y-2 type-label text-ink ${className}`}>
      {SKILL_FAMILIES.map(({ id, label }) => (
        <li key={id} className="flex items-center gap-1">
          <SkillMarker family={id} />
          {label}
        </li>
      ))}
    </ul>
  );
}
