import { useEffect, useState } from "react";
import { TOP_ID } from "../config/sections";
import { goTo } from "../lib/route";
import { ArrowUpIcon } from "./icons";

/**
 * ปุ่มกลับบนสุดพร้อมวงแหวนบอกว่าอ่านถึงไหนแล้ว (แทนแถบ progress ใต้ navbar)
 * วงแหวนเติมด้วย CSS scroll timeline (ring-progress ใน index.css) ไม่มี JS ต่อเฟรม และไม่ดึง framer-motion เข้า chunk แรก
 * browser ที่ไม่มี scroll timeline (Firefox) เห็นแค่ปุ่มกับเส้นราง แบบเดียวกับแถบ progress เดิม
 * พื้นวงกลมวาดด้วย SVG เพราะระบบไม่มี token มุมแบบวงกลม (rounded-full ถูกปิดไว้)
 */
export default function BackToTop() {
  const [shown, setShown] = useState(false);

  // ซ่อนตลอดที่ hero ยังอยู่ในจอ: ตรงนั้นอยู่บนสุดอยู่แล้ว ปุ่มจึงไม่มีประโยชน์
  useEffect(() => {
    const hero = document.getElementById(TOP_ID);
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      // goTo ตัวเดียวกับ "Back to top" ใน ⌘K: เลื่อน (smooth ตาม CSS ยกเว้น reduced motion) แล้วย้าย focus ไปที่ชื่อใน hero
      onClick={() => goTo(TOP_ID)}
      aria-label="Back to top"
      // visibility อยู่ใน transition: ตอนซ่อนยังเห็นจนจางเสร็จ แล้วจึงกดหรือ focus ไม่ได้ (การเลื่อนขึ้นตอนโผล่เป็น motion-safe: กฎ reduce ใน index.css ตัดแค่ animation ไม่ตัด transition)
      className={`group fixed right-4 bottom-6 z-[60] flex size-11 items-center justify-center rounded-control transition-[opacity,translate,visibility,scale] duration-(--duration-base) ease-out motion-safe:active:scale-[0.97] md:right-8 print:hidden ${
        shown ? "opacity-100" : "invisible opacity-0 motion-safe:translate-y-2"
      }`}
    >
      {/* หมุน -90° ให้เส้นเริ่มที่ 12 นาฬิกา; ขอบ stroke (3:1) ทำหน้าที่ขอบ control จึงไม่ต้องมีเงา */}
      <svg viewBox="0 0 44 44" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
        <circle cx="22" cy="22" r="21" fill="var(--color-surface)" stroke="var(--color-stroke)" />
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-rule)" strokeWidth={2} />
        <circle cx="22" cy="22" r="18" pathLength={1} className="ring-progress" />
      </svg>
      <ArrowUpIcon className="relative size-4 text-pen transition-transform duration-(--duration-fast) ease-out motion-safe:group-hover:-translate-y-0.5" />
    </button>
  );
}
