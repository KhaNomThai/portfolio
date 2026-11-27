import { useEffect, useRef, useState } from "react";

/**
 * true ตั้งแต่ครั้งแรกที่ element เข้ามาในจอ แล้วค้างไว้ตลอดอายุของ component (ใช้เล่นการขีดปากกาเน้นครั้งเดียว)
 * การ์ดโปรเจกต์ถูกสร้างใหม่ทุกครั้งที่เปลี่ยนตัวกรอง จึงขีดใหม่อีกรอบ ซึ่งช่วยบอกว่ารายการเปลี่ยนแล้ว
 * ค่าเริ่มต้นต้องเห็นอย่างน้อย 60% การขีดจึงเกิดตอนคนอ่านมองอยู่จริง ไม่ใช่ตอนเพิ่งโผล่ขอบจอ
 * element ที่อาจสูงกว่าจอ (ไม่มีวันเห็นถึง 60%) หรืออยู่ขอบล่างของจอแรก ให้ส่ง threshold ต่ำลง เช่น 0 ในแถบตัวเลขของ Hero
 */
export function useInViewOnce<T extends Element>(threshold = 0.6) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen, threshold]);

  return [ref, seen] as const;
}
