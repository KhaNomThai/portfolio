import { useEffect, useState } from "react";

const NUMBER = /\d[\d,]*(?:\.\d+)?/;
const DURATION_MS = 900;

/**
 * ตัวเลขตัวแรกในข้อความนับจาก 0 ขึ้นไปถึงค่าจริงเมื่อ start เป็น true (ข้อความรอบตัวเลขอยู่นิ่ง)
 * ตัวเลขที่กำลังนับวางทับค่าจริงที่โปร่งใสไว้ ความกว้างจึงคงที่ตลอด ข้อความข้าง ๆ ไม่ขยับ (CLS คงเดิม)
 * screen reader อ่านค่าจริงทันที ไม่ได้อ่านตัวเลขระหว่างนับ
 */
export default function CountUp({ value, start, delay = 0 }: { value: string; start: boolean; delay?: number }) {
  const match = value.match(NUMBER);
  const hasNumber = match !== null;
  const [progress, setProgress] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0
  );

  useEffect(() => {
    // ข้อความที่ไม่มีตัวเลข (เช่น "Student Leader") ไม่ต้องวน rAF ให้ render ซ้ำเปล่า ๆ
    if (!start || progress === 1 || !hasNumber) return;
    let frame = 0;
    const timer = setTimeout(() => {
      const begin = performance.now();
      const tick = (now: number) => {
        // timestamp ของ rAF คือเวลาต้นเฟรม อาจเก่ากว่า begin นิดหนึ่ง จึงกันไม่ให้ติดลบ
        const t = Math.min(Math.max((now - begin) / DURATION_MS, 0), 1);
        setProgress(1 - (1 - t) ** 3); // ease-out: พุ่งเร็วแล้วค่อยหยุดที่ค่าจริง
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    // progress อ่านแค่ตอนเริ่ม: ถ้าใส่ใน deps animation จะเริ่มใหม่ทุกเฟรม
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, delay, hasNumber]);

  if (!match) return value;
  const [num] = match;
  const decimals = num.split(".")[1]?.length ?? 0;
  const target = Number(num.replaceAll(",", ""));
  const shown = (target * progress).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: num.includes(","),
  });

  const done = progress === 1;
  // ค่าจริงอยู่ใน DOM ชุดเดียว (opacity-0 ระหว่างนับ ไม่ใช่ invisible): screen reader อ่านได้ คัดลอกข้อความไม่ได้เลขซ้ำ
  // และตอนพิมพ์ได้ค่าจริงแม้การ์ดยังไม่เคยเลื่อนมาเห็น
  return (
    <>
      {value.slice(0, match.index)}
      <span className="relative inline-block tabular-nums">
        <span className={done ? undefined : "opacity-0 print:opacity-100"}>{num}</span>
        {!done && (
          <span aria-hidden="true" className="absolute inset-0 text-right select-none print:hidden">
            {shown}
          </span>
        )}
      </span>
      {value.slice(match.index! + num.length)}
    </>
  );
}
