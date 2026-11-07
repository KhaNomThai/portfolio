import { useEffect, useRef } from "react";

/** มุมเอียงมากสุด: มากกว่านี้ข้อความในการ์ดเริ่มอ่านยากระหว่างชี้ */
const MAX_TILT_DEG = 4;

/**
 * บัตรคำเอียงตามเมาส์และมีแสงหมึกตามเคอร์เซอร์ (card-tilt ใน index.css) เฉพาะเมาส์/trackpad และผู้ใช้ที่ไม่ได้ปิด motion
 * เขียนค่าลง CSS variable ตรง ๆ ทีละเฟรมแบบเดียวกับหมึกใน hero จึงไม่ทำให้ React render ใหม่ตอนขยับเมาส์
 */
export function useCardTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    const allowed = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;

    const move = (e: PointerEvent) => {
      if (!allowed.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        card.style.setProperty("--tilt-x", `${(0.5 - y) * MAX_TILT_DEG}deg`);
        card.style.setProperty("--tilt-y", `${(x - 0.5) * MAX_TILT_DEG}deg`);
        card.style.setProperty("--spot-x", `${x * 100}%`);
        card.style.setProperty("--spot-y", `${y * 100}%`);
        card.dataset.tilt = "";
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
      delete card.dataset.tilt;
    };

    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", leave);
    };
  }, []);

  return ref;
}
